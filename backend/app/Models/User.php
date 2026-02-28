<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /* ── Role constants ──────────────────────────────────────── */
    public const ROLE_SUPER_ADMIN = 'SUPER_ADMIN';
    public const ROLE_HUB_ADMIN   = 'HUB_ADMIN';
    public const ROLE_ADMIN        = 'admin';   // legacy
    public const ROLE_RIDER        = 'rider';   // legacy

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

    /* ── Role helpers ──────────────────────────────────────── */

    public function isRider(): bool
    {
        return $this->role === self::ROLE_RIDER;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [
            self::ROLE_ADMIN,
            self::ROLE_SUPER_ADMIN,
            self::ROLE_HUB_ADMIN,
        ], true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isHubAdmin(): bool
    {
        return $this->role === self::ROLE_HUB_ADMIN;
    }

    /**
     * Resolve the active hub_id for this user.
     * HUB_ADMIN: always their assigned hub.
     * SUPER_ADMIN: from header/session.
     * Legacy admin: null (no hub scoping).
     */
    public function activeHubId(): ?int
    {
        if ($this->isHubAdmin()) {
            return $this->hub_id;
        }

        if ($this->isSuperAdmin()) {
            $header = request()?->header('X-Hub-Id');
            if ($header && is_numeric($header)) {
                return (int) $header;
            }
            return session('active_hub_id') ? (int) session('active_hub_id') : null;
        }

        return null;
    }
}
