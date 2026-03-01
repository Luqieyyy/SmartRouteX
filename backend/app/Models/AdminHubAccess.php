<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pivot model for admin ↔ hub access.
 *
 * Each row grants an admin user access to one hub.
 * SUPER_ADMIN does not need rows – they bypass access checks.
 */
class AdminHubAccess extends Model
{
    protected $table = 'admin_hub_access';

    protected $fillable = [
        'admin_id',
        'hub_id',
    ];

    /* ── Relationships ─────────────────────────────────────── */

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }
}
