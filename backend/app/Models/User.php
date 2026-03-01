<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /* ── Role constants ──────────────────────────────────────── */
    public const ROLE_SUPER_ADMIN      = 'SUPER_ADMIN';
    public const ROLE_REGIONAL_MANAGER = 'REGIONAL_MANAGER';
    public const ROLE_HUB_ADMIN        = 'HUB_ADMIN';
    public const ROLE_STAFF            = 'STAFF';
    public const ROLE_ADMIN            = 'admin';   // legacy
    public const ROLE_RIDER            = 'rider';   // legacy

    /** Roles that can access the admin panel. */
    public const ADMIN_ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_REGIONAL_MANAGER,
        self::ROLE_HUB_ADMIN,
        self::ROLE_STAFF,
        self::ROLE_ADMIN,
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'hub_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /* ── Relationships ─────────────────────────────────────── */

    public function rider(): HasOne
    {
        return $this->hasOne(Rider::class);
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    /**
     * Hubs this admin is allowed to access (via admin_hub_access pivot).
     * Used by REGIONAL_MANAGER, HUB_ADMIN, STAFF.
     * SUPER_ADMIN bypasses this entirely.
     */
    public function accessibleHubs(): BelongsToMany
    {
        return $this->belongsToMany(Hub::class, 'admin_hub_access', 'admin_id', 'hub_id')
                    ->withTimestamps();
    }

    /* ── Role helpers ──────────────────────────────────────── */

    public function isRider(): bool
    {
        return $this->role === self::ROLE_RIDER;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, self::ADMIN_ROLES, true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isRegionalManager(): bool
    {
        return $this->role === self::ROLE_REGIONAL_MANAGER;
    }

    public function isHubAdmin(): bool
    {
        return $this->role === self::ROLE_HUB_ADMIN;
    }

    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    /**
     * Can this admin switch hubs freely?
     */
    public function canSwitchHub(): bool
    {
        return in_array($this->role, [
            self::ROLE_SUPER_ADMIN,
            self::ROLE_REGIONAL_MANAGER,
        ], true);
    }

    /**
     * Get the IDs of hubs this admin is allowed to access.
     * SUPER_ADMIN → null (means ALL)
     * Others → array of hub IDs from the pivot table.
     */
    public function allowedHubIds(): ?array
    {
        if ($this->isSuperAdmin()) {
            return null; // no restriction
        }

        return $this->accessibleHubs()->pluck('hubs.id')->all();
    }

    /**
     * Check if this admin can access a specific hub.
     */
    public function canAccessHub(int $hubId): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return $this->accessibleHubs()->where('hubs.id', $hubId)->exists();
    }

    /**
     * Resolve the active hub_id for this user from the request context.
     *
     * SUPER_ADMIN:        X-Hub-Id header → session → null (all hubs)
     * REGIONAL_MANAGER:   X-Hub-Id header (validated) → first allowed hub
     * HUB_ADMIN / STAFF:  always their single assigned hub
     */
    public function activeHubId(): ?int
    {
        // HUB_ADMIN and STAFF: locked to single hub
        if ($this->isHubAdmin() || $this->isStaff()) {
            return $this->hub_id;
        }

        // SUPER_ADMIN and REGIONAL_MANAGER: dynamic from header
        $header = request()?->header('X-Hub-Id');
        if ($header && is_numeric($header)) {
            $hubId = (int) $header;

            // REGIONAL_MANAGER: validate against allowed hubs
            if ($this->isRegionalManager() && ! $this->canAccessHub($hubId)) {
                return null;
            }

            return $hubId;
        }

        // Fallback: session
        $sessionHub = session('active_hub_id');
        if ($sessionHub) {
            return (int) $sessionHub;
        }

        // SUPER_ADMIN with no selection → null (all hubs)
        if ($this->isSuperAdmin()) {
            return null;
        }

        // REGIONAL_MANAGER with no selection → first allowed hub
        if ($this->isRegionalManager()) {
            $ids = $this->allowedHubIds();
            return $ids[0] ?? null;
        }

        return null;
    }
}
