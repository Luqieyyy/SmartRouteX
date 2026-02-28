<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class RiderPasswordSetup extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'rider_id',
        'token_hash',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at'    => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    /* ── Relationships ─────────────────────────────────────────── */

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }

    /* ── Factory: create token row and return raw (un-hashed) token ── */

    /**
     * Generate a new setup token for a rider.
     * Returns the RAW token (to be emailed). Only the hash is stored.
     */
    public static function generateFor(Rider $rider): string
    {
        // Invalidate any previous unused tokens for this rider
        static::where('rider_id', $rider->id)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $rawToken = Str::random(64);

        static::create([
            'rider_id'   => $rider->id,
            'token_hash' => hash('sha256', $rawToken),
            'expires_at' => now()->addHours(24),
        ]);

        return $rawToken;
    }

    /* ── Look up by raw token ──────────────────────────────────── */

    /**
     * Find a valid (unused + not expired) setup row by raw token.
     */
    public static function findByRawToken(string $rawToken): ?static
    {
        return static::where('token_hash', hash('sha256', $rawToken))
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    /* ── Mark used ─────────────────────────────────────────────── */

    public function markUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
