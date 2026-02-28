<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Automatically filters query results by the current hub context.
 *
 * Applied to models that belong to a hub (Rider, Parcel, Zone).
 * The hub_id is resolved from the authenticated user's context:
 *  - HUB_ADMIN: always locked to their assigned hub_id.
 *  - SUPER_ADMIN: uses the hub_id set via X-Hub-Id header or session.
 */
class HubScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $hubId = static::resolveHubId();

        if ($hubId !== null) {
            $builder->where($model->getTable() . '.hub_id', $hubId);
        }
    }

    /**
     * Resolve the active hub_id from the current request context.
     */
    public static function resolveHubId(): ?int
    {
        $request = request();

        // Outside HTTP context (e.g. artisan commands, queue workers)
        if (! $request) {
            return null;
        }

        $user = $request->user();

        if (! $user || ! ($user instanceof \App\Models\User)) {
            return null;
        }

        // HUB_ADMIN: locked to their assigned hub
        if ($user->isHubAdmin()) {
            return $user->hub_id;
        }

        // SUPER_ADMIN: check request header first, then session/fallback
        if ($user->isSuperAdmin()) {
            $headerHub = $request->header('X-Hub-Id');
            if ($headerHub && is_numeric($headerHub)) {
                return (int) $headerHub;
            }

            // Session-based fallback (set via switch-hub endpoint)
            $sessionHub = session('active_hub_id');
            if ($sessionHub) {
                return (int) $sessionHub;
            }

            // Super admin with no hub selected — no scoping
            return null;
        }

        return null;
    }
}
