<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiderAuditLog extends Model
{
    public $timestamps = false;

    /* ── Action constants ─────────────────────────────────────── */
    public const ACTION_CREATED          = 'CREATED';
    public const ACTION_UPDATED          = 'UPDATED';
    public const ACTION_STATUS_CHANGED   = 'STATUS_CHANGED';
    public const ACTION_SETUP_EMAIL_SENT = 'SETUP_EMAIL_SENT';
    public const ACTION_PASSWORD_SET     = 'PASSWORD_SET';
    public const ACTION_LOGIN_FAILED     = 'LOGIN_FAILED';
    public const ACTION_LOCKED           = 'LOCKED';
    public const ACTION_LOGIN_SUCCESS    = 'LOGIN_SUCCESS';
    public const ACTION_LOGOUT           = 'LOGOUT';

    protected $fillable = [
        'rider_id',
        'action',
        'performed_by_admin_id',
        'ip_address',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    /* ── Relationships ─────────────────────────────────────────── */

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_admin_id');
    }

    /* ── Convenience logger ────────────────────────────────────── */

    public static function log(
        Rider  $rider,
        string $action,
        ?int   $adminId = null,
        ?string $ip = null,
        ?array  $metadata = null,
    ): static {
        return static::create([
            'rider_id'              => $rider->id,
            'action'                => $action,
            'performed_by_admin_id' => $adminId,
            'ip_address'            => $ip,
            'metadata'              => $metadata,
        ]);
    }
}
