<?php

namespace App\Policies;

use App\Models\Hub;
use App\Models\User;

class HubPolicy
{
    /**
     * Only SUPER_ADMIN can view the full hub list.
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    public function view(User $user, Hub $hub): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->isHubAdmin() && $user->hub_id === $hub->id;
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
