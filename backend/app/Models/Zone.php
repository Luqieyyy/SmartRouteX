<?php

namespace App\Models;

use App\Models\Traits\BelongsToHub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use SoftDeletes, BelongsToHub;

    protected $fillable = [
        'hub_id',
        'name',
        'code',
        'is_active',
        'zone_boundary',
        'color_code',
    ];

    protected function casts(): array
    {
        return [
            'is_active'     => 'boolean',
            'zone_boundary' => 'array',
        ];
    }

    /* ── Relationships ─────────────────────────────────────── */

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function riders(): HasMany
    {
        return $this->hasMany(Rider::class);
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function hasActiveDeliveries(): bool
    {
        return $this->parcels()
            ->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])
            ->exists();
    }

    /**
     * Check if a point (lat, lng) falls inside this zone's polygon boundary.
     * Uses the ray-casting algorithm (point-in-polygon).
     */
    public function containsPoint(float $lat, float $lng): bool
    {
        $boundary = $this->zone_boundary;

        if (! $boundary || count($boundary) < 3) {
            return false;
        }

        $n = count($boundary);
        $inside = false;

        for ($i = 0, $j = $n - 1; $i < $n; $j = $i++) {
            $xi = (float) ($boundary[$i]['lat'] ?? 0);
            $yi = (float) ($boundary[$i]['lng'] ?? 0);
            $xj = (float) ($boundary[$j]['lat'] ?? 0);
            $yj = (float) ($boundary[$j]['lng'] ?? 0);

            $intersect = (($yi > $lng) !== ($yj > $lng))
                && ($lat < ($xj - $xi) * ($lng - $yi) / ($yj - $yi) + $xi);

            if ($intersect) {
                $inside = ! $inside;
            }
        }

        return $inside;
    }

    /**
     * Whether this zone has a usable polygon boundary.
     */
    public function hasBoundary(): bool
    {
        return is_array($this->zone_boundary) && count($this->zone_boundary) >= 3;
    }

    /**
     * Check whether a given polygon boundary overlaps with any other
     * zone in the same hub (excluding this zone if it already exists).
     *
     * Uses vertex-in-polygon checks in both directions:
     *   - Any vertex of the candidate inside an existing zone
     *   - Any vertex of an existing zone inside the candidate
     *
     * @param  array       $candidateBoundary  Array of ['lat' => float, 'lng' => float]
     * @param  int         $hubId
     * @param  int|null    $excludeZoneId      Exclude this zone (for updates)
     * @return Zone|null   The first overlapping zone, or null if none.
     */
    public static function findOverlapping(array $candidateBoundary, int $hubId, ?int $excludeZoneId = null): ?self
    {
        if (count($candidateBoundary) < 3) {
            return null;
        }

        $siblings = self::withoutGlobalScopes()
            ->where('hub_id', $hubId)
            ->where('is_active', true)
            ->whereNotNull('zone_boundary')
            ->when($excludeZoneId, fn ($q) => $q->where('id', '!=', $excludeZoneId))
            ->get(['id', 'name', 'code', 'zone_boundary']);

        foreach ($siblings as $sibling) {
            if (! $sibling->hasBoundary()) {
                continue;
            }

            // Check if any vertex of candidate is inside sibling
            foreach ($candidateBoundary as $point) {
                if ($sibling->containsPoint((float) $point['lat'], (float) $point['lng'])) {
                    return $sibling;
                }
            }

            // Check if any vertex of sibling is inside candidate
            // Build a temporary zone instance for the candidate boundary
            $candidateZone = new self(['zone_boundary' => $candidateBoundary]);
            foreach ($sibling->zone_boundary as $point) {
                if ($candidateZone->containsPoint((float) $point['lat'], (float) $point['lng'])) {
                    return $sibling;
                }
            }
        }

        return null;
    }
}
