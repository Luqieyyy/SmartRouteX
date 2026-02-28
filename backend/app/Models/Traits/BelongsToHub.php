<?php

namespace App\Models\Traits;

use App\Models\Scopes\HubScope;

/**
 * Apply to any model that has a hub_id column and should be
 * automatically scoped to the current hub context.
 */
trait BelongsToHub
{
    public static function bootBelongsToHub(): void
    {
        static::addGlobalScope(new HubScope());
    }

    /**
     * Query without hub scoping (e.g. for super admin cross-hub reports).
     */
    public function scopeWithoutHubScope($query)
    {
        return $query->withoutGlobalScope(HubScope::class);
    }
}
