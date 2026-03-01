<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\Rider;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard/stats
     *
     * All queries use Parcel / Rider models which have BelongsToHub trait,
     * so the HubScope global scope automatically filters by the active hub.
     */
    public function stats(): JsonResponse
    {
        $today = Carbon::today();

        $totalParcelsToday = Parcel::whereDate('created_at', $today)->count();

        // DeliveryAttempt doesn't have hub_id directly — join through parcels
        $deliveredToday = DeliveryAttempt::where('result', 'DELIVERED')
            ->whereDate('attempted_at', $today)
            ->whereHas('parcel') // parcel scope filters by hub
            ->count();

        $failedAttempts = DeliveryAttempt::where('result', 'FAILED')
            ->whereDate('attempted_at', $today)
            ->whereHas('parcel')
            ->count();

        $activeRiders = Rider::where('is_active', true)->count();

        $totalAttempts = $deliveredToday + $failedAttempts;
        $successRate   = $totalAttempts > 0
            ? round(($deliveredToday / $totalAttempts) * 100, 1)
            : 0;

        return response()->json([
            'total_parcels_today' => $totalParcelsToday,
            'delivered_today'     => $deliveredToday,
            'failed_attempts'     => $failedAttempts,
            'active_riders'       => $activeRiders,
            'success_rate'        => $successRate,
        ]);
    }

    /**
     * GET /api/admin/dashboard/by-zone
     * Uses Zone model (BelongsToHub) for hub-scoped zone stats.
     */
    public function byZone(): JsonResponse
    {
        $zones = Zone::withCount('parcels')
            ->orderByDesc('parcels_count')
            ->limit(10)
            ->get(['id', 'name', 'code', 'hub_id'])
            ->map(fn ($z) => [
                'zone'  => $z->code ?: $z->name,
                'count' => $z->parcels_count,
            ]);

        return response()->json($zones->values());
    }

    /**
     * GET /api/admin/dashboard/trend
     * 7-day delivery trend, scoped by hub via parcel relationship.
     */
    public function trend(): JsonResponse
    {
        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));

        $trend = $days->map(function (Carbon $date) {
            $delivered = DeliveryAttempt::where('result', 'DELIVERED')
                ->whereDate('attempted_at', $date)
                ->whereHas('parcel')
                ->count();
            $failed = DeliveryAttempt::where('result', 'FAILED')
                ->whereDate('attempted_at', $date)
                ->whereHas('parcel')
                ->count();

            return [
                'date'      => $date->format('M d'),
                'delivered' => $delivered,
                'failed'    => $failed,
            ];
        });

        return response()->json($trend->values());
    }
}
