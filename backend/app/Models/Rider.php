<?php

namespace App\Models;

use App\Models\Traits\BelongsToHub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Rider extends Model
{
    use HasApiTokens, BelongsToHub;

    /* ── Status constants ──────────────────────────────────────── */
    public const STATUS_PENDING     = 'PENDING';
    public const STATUS_ACTIVE      = 'ACTIVE';
    public const STATUS_SUSPENDED   = 'SUSPENDED';
    public const STATUS_DEACTIVATED = 'DEACTIVATED';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_ACTIVE,
        self::STATUS_SUSPENDED,
        self::STATUS_DEACTIVATED,
    ];

    /* ── Lockout settings ──────────────────────────────────────── */
    public const MAX_FAILED_ATTEMPTS = 5;
    public const LOCKOUT_MINUTES     = 15;

    protected $fillable = [
        'user_id',
        'hub_id',
        'zone_id',
        'name',
        'work_email',
        'password',
        'phone',
        'zone',
        'employment_type',
        'warehouse',
        'vehicle_type',
        'vehicle_plate',
        'max_parcel_capacity',
        'shift_start',
        'shift_end',
        'status',
        'is_active',
        'must_change_password',
        'shift_active',
        'email_verified_at',
        'last_login_at',
        'failed_login_attempts',
        'locked_until',
        'created_by_admin_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'is_active'            => 'boolean',
            'shift_active'         => 'boolean',
            'must_change_password' => 'boolean',
            'email_verified_at'    => 'datetime',
            'last_login_at'        => 'datetime',
            'locked_until'         => 'datetime',
            'password'             => 'hashed',
        ];
    }

    /* ── Relationships ─────────────────────────────────────────── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function assignedZone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'zone_id');
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class, 'assigned_rider_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(RiderLocation::class);
    }

    public function latestLocation(): HasOne
    {
        return $this->hasOne(RiderLocation::class)->latestOfMany('recorded_at');
    }

    public function deliveryAttempts(): HasMany
    {
        return $this->hasMany(DeliveryAttempt::class);
    }

    public function passwordSetups(): HasMany
    {
        return $this->hasMany(RiderPasswordSetup::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(RiderAuditLog::class);
    }

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    /* ── Helpers ────────────────────────────────────────────────── */

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isLockedOut(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    public function incrementFailedAttempts(): void
    {
        $this->failed_login_attempts++;

        if ($this->failed_login_attempts >= self::MAX_FAILED_ATTEMPTS) {
            $this->locked_until = \Illuminate\Support\Carbon::now()->addMinutes(self::LOCKOUT_MINUTES);
            $this->failed_login_attempts = 0;

            RiderAuditLog::log($this, RiderAuditLog::ACTION_LOCKED, null, null, [
                'locked_until' => $this->locked_until->toIso8601String(),
            ]);
        }

        $this->save();
    }

    public function resetFailedAttempts(): void
    {
        $this->update([
            'failed_login_attempts' => 0,
            'locked_until'          => null,
            'last_login_at'         => now(),
        ]);
    }
}
