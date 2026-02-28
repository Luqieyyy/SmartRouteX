<?php

namespace App\Services;

use App\Models\Scopes\HubScope;
use App\Models\Zone;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ZoneService
{
    /**
     * Paginated zone listing (auto-scoped by hub).
     */
    public function list(?string $search = null, ?int $hubId = null, int $perPage = 20): LengthAwarePaginator
    {
        return Zone::query()
            ->with('hub:id,name,code')
            ->withCount(['riders', 'parcels'])
            ->when($search, fn ($q) => $q->where(function ($sub) use ($search) {
                $sub->where('name', 'ilike', "%{$search}%")
                    ->orWhere('code', 'ilike', "%{$search}%");
            }))
            ->when($hubId, fn ($q) => $q->where('hub_id', $hubId))
            ->orderBy('code')
            ->paginate($perPage);
    }

    /**
     * Active zones for a given hub (for dropdowns).
     */
    public function activeForHub(?int $hubId = null): Collection
    {
        $hubId = $hubId ?? HubScope::resolveHubId();

        $query = Zone::withoutHubScope()
            ->where('is_active', true)
            ->orderBy('code');

        if ($hubId) {
            $query->where('hub_id', $hubId);
        }

        return $query->get(['id', 'hub_id', 'name', 'code']);
    }

    public function create(array $data, ?int $hubId = null): Zone
    {
        if (! isset($data['hub_id'])) {
            $data['hub_id'] = $hubId ?? HubScope::resolveHubId();
        }

        if (! $data['hub_id']) {
            throw new \LogicException('Hub context is required to create a zone.');
        }

        return Zone::create($data);
    }

    public function update(Zone $zone, array $data): Zone
    {
        $zone->update($data);
        return $zone->fresh();
    }

    /**
     * Soft-delete a zone. Blocks if active parcels exist.
     *
     * @throws \LogicException
     */
    public function delete(Zone $zone): void
    {
        if ($zone->hasActiveDeliveries()) {
            throw new \LogicException('Cannot delete zone with active deliveries. Complete or reassign parcels first.');
        }

        $zone->delete();
    }
}
