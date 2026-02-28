<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Zone;

class ZonePolicy
{
    /**
     * Any authenticated admin can list zones (scoped by hub).
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isHubAdmin();
    }

    public function view(User $user, Zone $zone): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->isHubAdmin() && $user->hub_id === $zone->hub_id;
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isHubAdmin();
    }

    public function update(User $user, Zone $zone): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->isHubAdmin() && $user->hub_id === $zone->hub_id;
    }

    public function delete(User $user, Zone $zone): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->isHubAdmin() && $user->hub_id === $zone->hub_id;
    }
}
