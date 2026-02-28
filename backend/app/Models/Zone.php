<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Zone extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'hub_id',
        'name',
        'code',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /* ── Relationships ─────────────────────────────────────── */

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function riders(): HasMany
    {
        return $this->hasMany(Rider::class);
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function hasActiveDeliveries(): bool
    {
        return $this->parcels()
            ->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])
            ->exists();
    }
}
