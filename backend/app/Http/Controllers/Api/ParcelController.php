<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportParcelsRequest;
use App\Http\Requests\StoreParcelRequest;
use App\Models\Parcel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParcelController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->query('q');

        $parcels = Parcel::query()
            ->when($q, fn($qq) => $qq->where('barcode', 'ilike', "%{$q}%")
                                  ->orWhere('tracking_no', 'ilike', "%{$q}%")
                                  ->orWhere('recipient_name', 'ilike', "%{$q}%"))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($parcels);
    }

    public function show(Parcel $parcel)
    {
        return response()->json($parcel);
    }

    public function store(StoreParcelRequest $request)
    {
        $parcel = Parcel::create([
            ...$request->validated(),
            'priority' => $request->input('priority', 'NORMAL'),
            'status' => $request->input('status', 'CREATED'),
        ]);

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
            'priority' => ['nullable','in:NORMAL,EXPRESS'],
            'status' => ['nullable','in:CREATED,ASSIGNED,IN_TRANSIT,DELIVERED,FAILED'],
            'assigned_rider_id' => ['nullable','integer','exists:riders,id'],
        ]);

        // If assigning rider, set assigned_at + status if needed
        if (array_key_exists('assigned_rider_id', $data)) {
            if ($data['assigned_rider_id'] && !$parcel->assigned_rider_id) {
                $data['assigned_at'] = now();
                $data['status'] = $data['status'] ?? 'ASSIGNED';
            }
            if (!$data['assigned_rider_id']) {
                $data['assigned_at'] = null;
                $data['status'] = $data['status'] ?? 'CREATED';
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