<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parcel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Route Optimization Controller
 *
 * Implements a weighted scoring approach for stop ordering.
 * Weights: distance (haversine), priority penalty, zone clustering.
 * This is a server-side heuristic — replace with PostGIS pgRouting
 * or external OSRM/Google Directions for production road-network routing.
 */
class RouteOptimizationController extends Controller
{
    /**
     * POST /api/rider/route/suggest
     *
     * Body: { rider_id, parcel_ids[], strategy: shortest|priority|balanced, weights? }
     * Returns: ordered stops with estimated distance and ETA.
     */
    public function suggest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'parcel_ids'        => ['required', 'array', 'min:1'],
            'parcel_ids.*'      => ['integer', 'exists:parcels,id'],
            'strategy'          => ['required', 'in:shortest,priority,balanced'],
            'start_lat'         => ['required', 'numeric'],
            'start_lng'         => ['required', 'numeric'],
            'weights'           => ['nullable', 'array'],
            'weights.distance'  => ['nullable', 'numeric', 'min:0', 'max:10'],
            'weights.priority'  => ['nullable', 'numeric', 'min:0', 'max:10'],
        ]);

        $parcels = Parcel::whereIn('id', $data['parcel_ids'])->get();

        // Filter out parcels without GPS coordinates
        $withGps = $parcels->filter(fn ($p) => $p->recipient_lat && $p->recipient_lng);
        $withoutGps = $parcels->filter(fn ($p) => ! $p->recipient_lat || ! $p->recipient_lng);

        $strategy = $data['strategy'];
        $startLat = (float) $data['start_lat'];
        $startLng = (float) $data['start_lng'];

        // Default weights by strategy
        $wDistance = match ($strategy) {
            'shortest' => 10,
            'priority' => 2,
            'balanced' => 5,
        };
        $wPriority = match ($strategy) {
            'shortest' => 0,
            'priority' => 10,
            'balanced' => 5,
        };

        if (isset($data['weights'])) {
            $wDistance = $data['weights']['distance'] ?? $wDistance;
            $wPriority = $data['weights']['priority'] ?? $wPriority;
        }

        // Greedy nearest-neighbor with weighted scoring
        $ordered = collect();
        $remaining = $withGps->values()->all();
        $currentLat = $startLat;
        $currentLng = $startLng;
        $totalDistance = 0;

        while (count($remaining) > 0) {
            $bestIdx = 0;
            $bestScore = PHP_FLOAT_MAX;

            foreach ($remaining as $idx => $parcel) {
                $dist = $this->haversine($currentLat, $currentLng, $parcel->recipient_lat, $parcel->recipient_lng);
                $priorityPenalty = $parcel->priority === 'EXPRESS' ? 0 : 1;
                $score = ($wDistance * $dist) + ($wPriority * $priorityPenalty);

                if ($score < $bestScore) {
                    $bestScore = $score;
                    $bestIdx = $idx;
                }
            }

            $selected = $remaining[$bestIdx];
            $dist = $this->haversine($currentLat, $currentLng, $selected->recipient_lat, $selected->recipient_lng);
            $totalDistance += $dist;

            $ordered->push([
                'stop_order'  => $ordered->count() + 1,
                'parcel_id'   => $selected->id,
                'barcode'     => $selected->barcode,
                'recipient'   => $selected->recipient_name,
                'address'     => $selected->raw_address,
                'zone'        => $selected->zone,
                'priority'    => $selected->priority,
                'lat'         => $selected->recipient_lat,
                'lng'         => $selected->recipient_lng,
                'distance_km' => round($dist, 2),
            ]);

            $currentLat = $selected->recipient_lat;
            $currentLng = $selected->recipient_lng;

            array_splice($remaining, $bestIdx, 1);
        }

        // Append parcels without GPS at end
        foreach ($withoutGps as $parcel) {
            $ordered->push([
                'stop_order'  => $ordered->count() + 1,
                'parcel_id'   => $parcel->id,
                'barcode'     => $parcel->barcode,
                'recipient'   => $parcel->recipient_name,
                'address'     => $parcel->raw_address,
                'zone'        => $parcel->zone,
                'priority'    => $parcel->priority,
                'lat'         => null,
                'lng'         => null,
                'distance_km' => null,
            ]);
        }

        // Estimate ETA: average 25 km/h urban + 2 min per stop
        $etaMin = $totalDistance > 0
            ? round(($totalDistance / 25) * 60 + $ordered->count() * 2)
            : $ordered->count() * 5;

        return response()->json([
            'strategy'      => $strategy,
            'total_stops'   => $ordered->count(),
            'distance_km'   => round($totalDistance, 2),
            'eta_min'       => (int) $etaMin,
            'stops'         => $ordered->values(),
        ]);
    }

    /**
     * Haversine distance in km.
     */
    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $r * $c;
    }
}
