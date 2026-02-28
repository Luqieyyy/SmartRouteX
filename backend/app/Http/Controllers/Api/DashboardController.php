<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryAttempt;
use App\Models\Parcel;
use App\Models\Rider;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $today = Carbon::today();

        $totalParcelsToday = Parcel::whereDate('created_at', $today)->count();
        $deliveredToday    = DeliveryAttempt::where('result', 'DELIVERED')
                                ->whereDate('attempted_at', $today)->count();
        $failedAttempts    = DeliveryAttempt::where('result', 'FAILED')
                                ->whereDate('attempted_at', $today)->count();
        $activeRiders      = Rider::where('is_active', true)->count();

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

    public function byZone(): JsonResponse
    {
        $zones = Parcel::select('zone', DB::raw('count(*) as count'))
            ->whereNotNull('zone')
            ->groupBy('zone')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return response()->json($zones);
    }

    public function trend(): JsonResponse
    {
        $days = collect(range(6, 0))->map(fn ($i) => Carbon::today()->subDays($i));

        $trend = $days->map(function (Carbon $date) {
            $delivered = DeliveryAttempt::where('result', 'DELIVERED')
                ->whereDate('attempted_at', $date)->count();
            $failed = DeliveryAttempt::where('result', 'FAILED')
                ->whereDate('attempted_at', $date)->count();

            return [
                'date'      => $date->format('M d'),
                'delivered' => $delivered,
                'failed'    => $failed,
            ];
        });

        return response()->json($trend->values());
    }
}
