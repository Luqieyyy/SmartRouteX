<?php

namespace App\Services;

use App\Models\Zone;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Service for detecting which zone a geographic point belongs to.
 *
 * Caches zone boundaries per hub for performance at scale.
 * Designed to handle 500+ zones and 50,000+ parcels daily.
 */
class ZoneDetectionService
{
    /**
     * Cache TTL in seconds (5 minutes).
     * Zone boundaries rarely change, so this is safe.
     */
    private const CACHE_TTL = 300;

    /**
     * Detect the zone for a given lat/lng within a specific hub.
     *
     * @param  int        $hubId
     * @param  float      $lat
     * @param  float      $lng
     * @return Zone|null  The matching zone, or null if no zone contains the point.
     */
    public function detect(int $hubId, float $lat, float $lng): ?Zone
    {
        $zones = $this->getZonesWithBoundaries($hubId);

        foreach ($zones as $zone) {
            if ($zone->containsPoint($lat, $lng)) {
                return $zone;
            }
        }

        return null;
    }

    /**
     * Detect zone and return just the ID. Most common use case.
     */
    public function detectZoneId(int $hubId, float $lat, float $lng): ?int
    {
        return $this->detect($hubId, $lat, $lng)?->id;
    }

    /**
     * Batch detect zones for multiple points (e.g., CSV import).
     * Returns an array keyed by index with zone_id or null.
     *
     * @param  int   $hubId
     * @param  array $points  Array of ['lat' => float, 'lng' => float]
     * @return array<int, int|null>
     */
    public function detectBatch(int $hubId, array $points): array
    {
        $zones = $this->getZonesWithBoundaries($hubId);
        $results = [];

        foreach ($points as $index => $point) {
            $lat = (float) ($point['lat'] ?? 0);
            $lng = (float) ($point['lng'] ?? 0);
            $results[$index] = null;

            foreach ($zones as $zone) {
                if ($zone->containsPoint($lat, $lng)) {
                    $results[$index] = $zone->id;
                    break;
                }
            }
        }

        return $results;
    }

    /**
     * Get all zones with boundaries for a hub.
     * Cached per hub for performance.
     *
     * @return Collection<int, Zone>
     */
    public function getZonesWithBoundaries(int $hubId): Collection
    {
        $cacheKey = "hub:{$hubId}:zone_boundaries";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($hubId) {
            return Zone::withoutGlobalScopes()
                ->where('hub_id', $hubId)
                ->where('is_active', true)
                ->whereNotNull('zone_boundary')
                ->get(['id', 'hub_id', 'name', 'code', 'zone_boundary', 'color_code']);
        });
    }

    /**
     * Invalidate the boundary cache for a hub.
     * Call this whenever a zone boundary is created/updated/deleted.
     */
    public function invalidateCache(int $hubId): void
    {
        Cache::forget("hub:{$hubId}:zone_boundaries");
    }

    /**
     * Get all zone boundaries for a hub (for frontend map overlay).
     * Returns a lightweight array suitable for JSON response.
     *
     * @return array<int, array{id: int, name: string, code: string, color_code: string, zone_boundary: array}>
     */
    public function getBoundariesForHub(int $hubId): array
    {
        return $this->getZonesWithBoundaries($hubId)
            ->map(fn (Zone $z) => [
                'id'            => $z->id,
                'name'          => $z->name,
                'code'          => $z->code,
                'color_code'    => $z->color_code,
                'zone_boundary' => $z->zone_boundary,
            ])
            ->values()
            ->all();
    }
}
