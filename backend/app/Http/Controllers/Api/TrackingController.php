<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\Parcel;
use App\Models\RiderLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    /**
     * GET /api/admin/tracking/riders
     * Returns latest GPS position for every active rider (hub-scoped).
     */
    public function riders(Request $request): JsonResponse
    {
        // Get riders who are currently on shift (shift_active = true)
        // Also include those who are just active for visibility
        $riders = Rider::where('is_active', true)
            ->where('shift_active', true)
            ->with(['latestLocation'])
            ->withCount([
                'parcels as assigned_parcels' => fn ($q) => $q->whereIn('status', ['ASSIGNED', 'IN_TRANSIT']),
            ])
            ->get();

        $positions = $riders->map(fn ($r) => [
            'rider_id'         => $r->id,
            'rider_name'       => $r->name,
            'lat'              => $r->latestLocation ? (float) $r->latestLocation->lat : null,
            'lng'              => $r->latestLocation ? (float) $r->latestLocation->lng : null,
            'recorded_at'      => $r->latestLocation?->recorded_at?->toIso8601String(),
            'assigned_parcels' => $r->assigned_parcels,
            'shift_active'     => $r->shift_active,
            'phone'            => $r->phone,
            'zone'             => $r->zone,
        ])->values();

        return response()->json($positions);
    }

    /**
     * GET /api/admin/tracking/parcels
     * Returns all assigned/in-transit parcels that have GPS coordinates.
     */
    public function parcels(Request $request): JsonResponse
    {
        $parcels = Parcel::whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])
            ->whereNotNull('recipient_lat')
            ->whereNotNull('recipient_lng')
            ->with('rider:id,name')
            ->get(['id', 'barcode', 'recipient_lat', 'recipient_lng', 'zone', 'status', 'assigned_rider_id']);

        $points = $parcels->map(fn ($p) => [
            'id'          => $p->id,
            'barcode'     => $p->barcode,
            'lat'         => (float) $p->recipient_lat,
            'lng'         => (float) $p->recipient_lng,
            'zone'        => $p->zone,
            'status'      => $p->status,
            'rider_name'  => $p->rider?->name,
        ])->values();

        return response()->json($points);
    }
}
