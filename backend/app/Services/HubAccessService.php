<?php

namespace App\Services;

use App\Models\AdminHubAccess;
use App\Models\Hub;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Service for managing admin hub access.
 *
 * Centralises the logic for:
 *  - Loading accessible hubs for a user (used by login, /me, hub selector)
 *  - Granting / revoking hub access
 *  - Building the hub_context payload returned to the frontend
 */
class HubAccessService
{
    /**
     * Get the hubs the admin can access, formatted for the frontend hub selector.
     *
     * Returns an array of {id, code, name, state} hubs.
     * SUPER_ADMIN: all active hubs.
     * REGIONAL_MANAGER: only hubs in pivot table.
     * HUB_ADMIN / STAFF: their single assigned hub.
     */
    public function getAccessibleHubs(User $user): Collection
    {
        if ($user->isSuperAdmin()) {
            return Hub::where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'name', 'code', 'state', 'latitude', 'longitude']);
        }

        return $user->accessibleHubs()
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['hubs.id', 'hubs.name', 'hubs.code', 'hubs.state', 'hubs.latitude', 'hubs.longitude']);
    }

    /**
     * Build the hub_context payload for auth responses (login, /me).
     *
     * @return array{
     *   role: string,
     *   can_switch: bool,
     *   show_global: bool,
     *   accessible_hubs: array,
     *   active_hub_id: int|null,
     * }
     */
    public function buildHubContext(User $user): array
    {
        $hubs = $this->getAccessibleHubs($user);
        $activeHubId = $user->activeHubId();

        return [
            'role'             => $user->role,
            'can_switch'       => $user->canSwitchHub(),
            'show_global'      => $user->isSuperAdmin(),
            'accessible_hubs'  => $hubs->toArray(),
            'active_hub_id'    => $activeHubId,
        ];
    }

    /**
     * Grant a user access to one or more hubs.
     * Idempotent – existing entries are ignored.
     */
    public function grantAccess(User $user, array $hubIds): void
    {
        $user->accessibleHubs()->syncWithoutDetaching($hubIds);
    }

    /**
     * Revoke hub access.
     */
    public function revokeAccess(User $user, array $hubIds): void
    {
        $user->accessibleHubs()->detach($hubIds);
    }

    /**
     * Replace all hub access for a user (e.g., when editing a REGIONAL_MANAGER).
     */
    public function setAccess(User $user, array $hubIds): void
    {
        $user->accessibleHubs()->sync($hubIds);
    }
}
