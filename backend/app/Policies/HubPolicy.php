<?php

namespace App\Policies;

use App\Models\Hub;
use App\Models\User;

class HubPolicy
{
    /**
     * SUPER_ADMIN and REGIONAL_MANAGER can view the hub list.
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isRegionalManager();
    }

    public function view(User $user, Hub $hub): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->canAccessHub($hub->id);
    }

    public function create(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function update(User $user, Hub $hub): bool
    {
        return $user->isSuperAdmin();
    }

    public function delete(User $user, Hub $hub): bool
    {
        return $user->isSuperAdmin();
    }
}
