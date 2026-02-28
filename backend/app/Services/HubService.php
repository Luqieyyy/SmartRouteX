<?php

namespace App\Services;

use App\Models\Hub;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class HubService
{
    /**
     * Paginated hub listing with optional search.
     */
    public function list(?string $search = null, int $perPage = 20): LengthAwarePaginator
    {
        return Hub::query()
            ->withCount(['zones', 'riders', 'parcels'])
            ->when($search, fn ($q) => $q->where(function ($sub) use ($search) {
                $sub->where('name', 'ilike', "%{$search}%")
                    ->orWhere('code', 'ilike', "%{$search}%")
                    ->orWhere('state', 'ilike', "%{$search}%");
            }))
            ->orderBy('code')
            ->paginate($perPage);
    }

    /**
     * All active hubs (for dropdowns).
     */
    public function allActive(): Collection
    {
        return Hub::where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'name', 'code', 'state']);
    }

    public function create(array $data): Hub
    {
        return Hub::create($data);
    }

    public function update(Hub $hub, array $data): Hub
    {
        $hub->update($data);
        return $hub->fresh();
    }

    /**
     * Soft-delete a hub. Blocks if riders exist.
     *
     * @throws \LogicException
     */
    public function delete(Hub $hub): void
    {
        if ($hub->hasRiders()) {
            throw new \LogicException('Cannot delete hub with assigned riders. Reassign or remove riders first.');
        }

        $hub->delete();
    }
}
