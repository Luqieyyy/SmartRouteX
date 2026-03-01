<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\Rider;
use App\Models\RiderLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RiderAppController extends Controller
{
    // ─── helpers ───────────────────────────────────────────────

    private function rider(Request $request): Rider
    {
        return $request->user()->rider;
    }

    // ─── profile ──────────────────────────────────────────────

    /**
     * GET /api/rider/profile
     */
    public function profile(Request $request): JsonResponse
    {
        $rider = $this->rider($request);
        $rider->load('latestLocation');

        $today = now()->startOfDay();

        $assigned  = $rider->parcels()->where('status', 'ASSIGNED')->count();
        $inTransit = $rider->parcels()->where('status', 'IN_TRANSIT')->count();
        $delivered = DeliveryAttempt::where('rider_id', $rider->id)
            ->where('result', 'DELIVERED')
            ->whereDate('attempted_at', $today)
            ->count();
        $failed = DeliveryAttempt::where('rider_id', $rider->id)
            ->where('result', 'FAILED')
            ->whereDate('attempted_at', $today)
            ->count();

        return response()->json([
            'rider'   => $rider,
            'summary' => compact('assigned', 'inTransit', 'delivered', 'failed'),
        ]);
    }

    /**
     * PATCH /api/rider/profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => ['sometimes', 'string', 'max:255'],
            'phone'        => ['sometimes', 'string', 'max:30'],
            'shift_active' => ['sometimes', 'boolean'],
        ]);

        $rider = $this->rider($request);
        $rider->update($data);

        return response()->json(['ok' => true, 'rider' => $rider->fresh()]);
    }

    // ─── location ─────────────────────────────────────────────

    /**
     * POST /api/rider/location
     */
    public function storeLocation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'lat'         => ['required', 'numeric', 'between:-90,90'],
            'lng'         => ['required', 'numeric', 'between:-180,180'],
            'accuracy'    => ['nullable', 'numeric'],
            'speed'       => ['nullable', 'numeric'],
            'heading'     => ['nullable', 'numeric'],
            'recorded_at' => ['nullable', 'date'],
        ]);

        $rider = $this->rider($request);

        RiderLocation::create([
            'rider_id'    => $rider->id,
            'lat'         => $data['lat'],
            'lng'         => $data['lng'],
            'accuracy'    => $data['accuracy'] ?? null,
            'speed'       => $data['speed'] ?? null,
            'heading'     => $data['heading'] ?? null,
            'recorded_at' => $data['recorded_at'] ?? now(),
        ]);

        return response()->json(['ok' => true]);
    }

    // ─── parcels ──────────────────────────────────────────────

    /**
     * GET /api/rider/parcels?status=ASSIGNED|IN_TRANSIT|DELIVERED|FAILED
     */
    public function parcels(Request $request): JsonResponse
    {
        $rider  = $this->rider($request);
        $status = $request->query('status');
        $q      = $request->query('q');

        $parcels = Parcel::where('assigned_rider_id', $rider->id)
            ->when($rider->zone_id, fn ($query, $zoneId) => $query->where('zone_id', $zoneId))
            ->when($status, fn ($query) => $query->where('status', $status))
            ->when($q, fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('barcode', 'ilike', "%{$q}%")
                    ->orWhere('recipient_name', 'ilike', "%{$q}%");
            }))
            ->orderByRaw("CASE priority WHEN 'EXPRESS' THEN 0 ELSE 1 END")
            ->orderByDesc('id')
            ->paginate(30);

        return response()->json($parcels);
    }

    /**
     * POST /api/rider/parcels/claim — Atomic barcode claim
     */
    public function claim(Request $request): JsonResponse
    {
        $request->validate([
            'barcode' => ['required', 'string'],
        ]);

        $rider = $this->rider($request);

        return DB::transaction(function () use ($request, $rider) {
            $parcel = Parcel::where('barcode', $request->barcode)
                ->lockForUpdate()
                ->first();

            if (! $parcel) {
                return response()->json([
                    'ok'      => false,
                    'message' => 'Parcel not found.',
                ], 404);
            }

            // Already assigned to another rider
            if ($parcel->assigned_rider_id && $parcel->assigned_rider_id !== $rider->id) {
                return response()->json([
                    'ok'      => false,
                    'message' => 'Parcel already assigned to another rider.',
                ], 409);
            }

            // Already assigned to this rider
            if ($parcel->assigned_rider_id === $rider->id) {
                return response()->json([
                    'ok'     => true,
                    'parcel' => $parcel,
                    'note'   => 'Already assigned to you.',
                ]);
            }

            $parcel->update([
                'assigned_rider_id' => $rider->id,
                'assigned_at'       => now(),
                'status'            => 'ASSIGNED',
            ]);

            return response()->json([
                'ok'     => true,
                'parcel' => $parcel->fresh(),
            ]);
        });
    }

    /**
     * POST /api/rider/parcels/scan — Pickup or Delivery scan
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'barcode'   => ['required', 'string'],
            'scan_type' => ['required', 'in:PICKUP,DELIVERY'],
        ]);

        $rider  = $this->rider($request);
        $parcel = Parcel::where('barcode', $request->barcode)
            ->where('assigned_rider_id', $rider->id)
            ->first();

        if (! $parcel) {
            return response()->json([
                'ok'      => false,
                'message' => 'Parcel not assigned to you.',
            ], 404);
        }

        if ($request->scan_type === 'PICKUP') {
            if ($parcel->status !== 'ASSIGNED') {
                return response()->json([
                    'ok'      => false,
                    'message' => 'Parcel is not in ASSIGNED state.',
                ], 422);
            }
            $parcel->update(['status' => 'IN_TRANSIT']);
        }

        if ($request->scan_type === 'DELIVERY') {
            if ($parcel->status !== 'IN_TRANSIT') {
                return response()->json([
                    'ok'      => false,
                    'message' => 'Parcel is not in IN_TRANSIT state.',
                ], 422);
            }
            $parcel->update(['status' => 'DELIVERED']);

            DeliveryAttempt::create([
                'parcel_id'    => $parcel->id,
                'rider_id'     => $rider->id,
                'result'       => 'DELIVERED',
                'attempted_at' => now(),
            ]);
        }

        return response()->json([
            'ok'     => true,
            'parcel' => $parcel->fresh(),
        ]);
    }

    /**
     * POST /api/rider/parcels/{parcel}/pod — Proof of Delivery upload
     */
    public function pod(Request $request, Parcel $parcel): JsonResponse
    {
        $rider = $this->rider($request);

        if ($parcel->assigned_rider_id !== $rider->id) {
            return response()->json(['ok' => false, 'message' => 'Not your parcel.'], 403);
        }

        $request->validate([
            'image'        => ['required', 'image', 'max:5120'], // 5 MB
            'note'         => ['nullable', 'string', 'max:500'],
            'lat'          => ['nullable', 'numeric'],
            'lng'          => ['nullable', 'numeric'],
            'delivered_at' => ['nullable', 'date'],
        ]);

        $path = $request->file('image')->store('pod', 'public');

        $parcel->update(['status' => 'DELIVERED']);

        $attempt = DeliveryAttempt::create([
            'parcel_id'     => $parcel->id,
            'rider_id'      => $rider->id,
            'result'        => 'DELIVERED',
            'note'          => $request->input('note'),
            'pod_image_url' => Storage::url($path),
            'lat'           => $request->input('lat'),
            'lng'           => $request->input('lng'),
            'attempted_at'  => $request->input('delivered_at', now()),
        ]);

        return response()->json([
            'ok'      => true,
            'attempt' => $attempt,
        ]);
    }

    /**
     * POST /api/rider/parcels/{parcel}/fail — Mark delivery as failed
     */
    public function fail(Request $request, Parcel $parcel): JsonResponse
    {
        $rider = $this->rider($request);

        if ($parcel->assigned_rider_id !== $rider->id) {
            return response()->json(['ok' => false, 'message' => 'Not your parcel.'], 403);
        }

        $request->validate([
            'reason'       => ['required', 'string', 'max:100'],
            'note'         => ['nullable', 'string', 'max:500'],
            'lat'          => ['nullable', 'numeric'],
            'lng'          => ['nullable', 'numeric'],
            'attempted_at' => ['nullable', 'date'],
        ]);

        $parcel->update(['status' => 'FAILED']);

        $attempt = DeliveryAttempt::create([
            'parcel_id'    => $parcel->id,
            'rider_id'     => $rider->id,
            'result'       => 'FAILED',
            'note'         => trim($request->reason . ' — ' . ($request->note ?? '')),
            'lat'          => $request->input('lat'),
            'lng'          => $request->input('lng'),
            'attempted_at' => $request->input('attempted_at', now()),
        ]);

        return response()->json([
            'ok'      => true,
            'attempt' => $attempt,
        ]);
    }
}
