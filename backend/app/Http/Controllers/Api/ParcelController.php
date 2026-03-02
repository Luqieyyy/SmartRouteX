<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportParcelsRequest;
use App\Http\Requests\StoreParcelRequest;
use App\Models\Parcel;
use App\Services\ZoneDetectionService;
use App\Services\GeocodingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParcelController extends Controller
{
    public function __construct(
        private readonly ZoneDetectionService $zoneDetection,
        private readonly GeocodingService $geocoding,
    ) {}

    public function index(Request $request)
    {
        $q = $request->query('q');

        $parcels = Parcel::query()
            ->with('rider:id,name')
            ->when($q, fn($qq) => $qq->where('barcode', 'ilike', "%{$q}%")
                                  ->orWhere('tracking_no', 'ilike', "%{$q}%")
                                  ->orWhere('recipient_name', 'ilike', "%{$q}%"))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($parcels);
    }

    public function show(Parcel $parcel)
    {
        $parcel->load([
            'rider:id,name,phone',
            'deliveryAttempts' => fn ($q) => $q->with('rider:id,name')->orderByDesc('attempted_at'),
        ]);

        return response()->json($parcel);
    }

    public function store(StoreParcelRequest $request)
    {
        $data = [
            ...$request->validated(),
            'priority' => $request->input('priority', 'NORMAL'),
            'status'   => $request->input('status', 'CREATED'),
        ];

        // ── Auto-inject hub_id from active hub context ──────────────
        // If the form didn't include hub_id, resolve it from the X-Hub-Id
        // header (the same source HubScope uses for filtering).
        // Without this, newly created parcels get hub_id=NULL and become
        // invisible under any hub-scoped GET query.
        if (empty($data['hub_id'])) {
            $resolvedHubId = \App\Models\Scopes\HubScope::resolveHubId();
            if ($resolvedHubId) {
                $data['hub_id'] = $resolvedHubId;
            }
        }

        // Extract Geocode from raw address if missing lat/lng
        if (empty($data['recipient_lat']) && empty($data['recipient_lng']) && !empty($data['raw_address'])) {
            $coords = $this->geocoding->geocode($data['raw_address']);
            if ($coords) {
                $data['recipient_lat'] = $coords['lat'];
                $data['recipient_lng'] = $coords['lng'];
            }
        }

        // Auto-detect zone from coordinates + hub context
        if (! empty($data['recipient_lat']) && ! empty($data['recipient_lng']) && ! empty($data['hub_id'])) {
            $detectedZoneId = $this->zoneDetection->detectZoneId(
                (int) $data['hub_id'],
                (float) $data['recipient_lat'],
                (float) $data['recipient_lng'],
            );
            if ($detectedZoneId) {
                $data['zone_id'] = $detectedZoneId;
            }
        }

        $parcel = Parcel::create($data);

        return response()->json(['ok' => true, 'parcel' => $parcel], 201);
    }

    public function update(Request $request, Parcel $parcel)
    {
        $data = $request->validate([
            'tracking_no' => ['nullable','string','max:100'],
            'recipient_name' => ['nullable','string','max:255'],
            'recipient_phone' => ['nullable','string','max:30'],
            'raw_address' => ['nullable','string'],
            'zone' => ['nullable','string','max:100'],
            'zone_id' => ['nullable','integer','exists:zones,id'],
            'priority' => ['nullable','in:NORMAL,EXPRESS'],
            'status' => ['nullable','in:CREATED,ASSIGNED,IN_TRANSIT,DELIVERED,FAILED'],
            'assigned_rider_id' => ['nullable','integer','exists:riders,id'],
        ]);

        // If assigning rider, set assigned_at + status if needed
        if (array_key_exists('assigned_rider_id', $data)) {
            if ($data['assigned_rider_id'] && ! $parcel->assigned_rider_id) {
                $data['assigned_at'] = now();
            }
            // Auto-upgrade status from CREATED to ASSIGNED if a rider is given
            if (!empty($data['assigned_rider_id'])) {
                if (empty($data['status']) || ($data['status'] ?? $parcel->status) === 'CREATED') {
                    $data['status'] = 'ASSIGNED';
                }
            }
            if (! $data['assigned_rider_id']) {
                $data['assigned_at'] = null;
                if (($data['status'] ?? $parcel->status) === 'ASSIGNED') {
                    $data['status'] = 'CREATED';
                }
            }
        }

        // Extract Geocode from raw address if address changed or lat/lng missing
        if (!empty($data['raw_address']) && ($data['raw_address'] !== $parcel->raw_address || empty($parcel->recipient_lat))) {
            $coords = $this->geocoding->geocode($data['raw_address']);
            if ($coords) {
                $data['recipient_lat'] = $coords['lat'];
                $data['recipient_lng'] = $coords['lng'];
            }
        }

        // Re-detect zone if coordinates were updated
        if (!empty($data['recipient_lat']) && !empty($data['recipient_lng']) && $parcel->hub_id) {
            $detectedZoneId = $this->zoneDetection->detectZoneId(
                (int) $parcel->hub_id,
                (float) $data['recipient_lat'],
                (float) $data['recipient_lng'],
            );
            if ($detectedZoneId) {
                $data['zone_id'] = $detectedZoneId;
            }
        }

        $parcel->update($data);

        return response()->json(['ok' => true, 'parcel' => $parcel]);
    }

    public function destroy(Parcel $parcel)
    {
        $parcel->delete();
        return response()->json(['ok' => true]);
    }

    public function importCsv(ImportParcelsRequest $request)
    {
        $file = $request->file('file');
        $defaultPriority = $request->input('default_priority', 'NORMAL');
        $defaultZone = $request->input('default_zone');

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            return response()->json(['ok' => false, 'message' => 'Fail read file'], 400);
        }

        // Expect header row:
        // barcode,tracking_no,recipient_name,recipient_phone,raw_address,zone,priority
        $header = fgetcsv($handle);
        if (!$header) {
            return response()->json(['ok' => false, 'message' => 'CSV kosong'], 400);
        }

        $map = array_map(fn($h) => strtolower(trim($h)), $header);

        $inserted = 0;
        $skipped = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowAssoc = [];
                foreach ($map as $i => $key) {
                    $rowAssoc[$key] = $row[$i] ?? null;
                }

                $barcode = trim((string)($rowAssoc['barcode'] ?? ''));
                if ($barcode === '') {
                    $skipped++;
                    continue;
                }

                // Skip if already exists (anti double-import)
                $exists = Parcel::where('barcode', $barcode)->exists();
                if ($exists) {
                    $skipped++;
                    continue;
                }

                $priority = strtoupper(trim((string)($rowAssoc['priority'] ?? ''))) ?: $defaultPriority;
                if (!in_array($priority, ['NORMAL','EXPRESS'], true)) $priority = $defaultPriority;

                $zone = trim((string)($rowAssoc['zone'] ?? ''));
                $zone = $zone !== '' ? $zone : $defaultZone;

                Parcel::create([
                    'barcode' => $barcode,
                    'tracking_no' => $rowAssoc['tracking_no'] ?? null,
                    'recipient_name' => $rowAssoc['recipient_name'] ?? null,
                    'recipient_phone' => $rowAssoc['recipient_phone'] ?? null,
                    'raw_address' => $rowAssoc['raw_address'] ?? null,
                    'zone' => $zone,
                    'priority' => $priority,
                    'status' => 'CREATED',
                ]);

                $inserted++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            return response()->json([
                'ok' => false,
                'message' => 'Import gagal',
                'error' => $e->getMessage(),
            ], 500);
        }

        fclose($handle);

        return response()->json([
            'ok' => true,
            'inserted' => $inserted,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }
}