<?php

namespace App\Models\Scopes;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Automatically filters query results by the current hub context.
 *
 * Applied to models that belong to a hub (Rider, Parcel, Zone) via the
 * BelongsToHub trait.
 *
 * Resolution order:
 *  1. SUPER_ADMIN (no hub selected)  → no filter (all hubs)
 *  2. SUPER_ADMIN (hub selected)     → WHERE hub_id = <selected>
 *  3. REGIONAL_MANAGER (hub selected)→ WHERE hub_id = <selected>  (validated)
 *  4. REGIONAL_MANAGER (none)        → WHERE hub_id IN (<allowed>)
 *  5. HUB_ADMIN / STAFF              → WHERE hub_id = <assigned>
 */
class HubScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $hubId = static::resolveHubId();

        if ($hubId !== null) {
            $builder->where($model->getTable() . '.hub_id', $hubId);
            return;
        }

        // REGIONAL_MANAGER with no specific hub → scope to all allowed hubs
        $allowedIds = static::resolveAllowedHubIds();
        if ($allowedIds !== null) {
            $builder->whereIn($model->getTable() . '.hub_id', $allowedIds);
        }

        // SUPER_ADMIN with null → no filter, sees everything
    }

    /**
     * Resolve the single active hub_id from the current request context.
     */
    public static function resolveHubId(): ?int
    {
        $request = request();

        if (! $request) {
            return null;
        }

        $user = $request->user();

        if (! $user || ! ($user instanceof User)) {
            return null;
        }

        return $user->activeHubId();
    }

    /**
     * For REGIONAL_MANAGER: get all allowed hub IDs (when no specific hub selected).
     * Returns null for SUPER_ADMIN (no restriction) and for roles with a
     * single active hub already resolved by resolveHubId().
     */
    public static function resolveAllowedHubIds(): ?array
    {
        $request = request();

        if (! $request) {
            return null;
        }

        $user = $request->user();

        if (! $user || ! ($user instanceof User)) {
            return null;
        }

        // Only applies to REGIONAL_MANAGER when no specific hub is active
        if ($user->isRegionalManager() && $user->activeHubId() === null) {
            return $user->allowedHubIds();
        }

        return null;
    }
}
