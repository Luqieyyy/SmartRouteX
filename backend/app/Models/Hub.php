<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Hub extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'state',
        'latitude',
        'longitude',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'latitude'  => 'float',
            'longitude' => 'float',
        ];
    }

    /* ── Relationships ─────────────────────────────────────── */

    public function zones(): HasMany
    {
        return $this->hasMany(Zone::class);
    }

    public function riders(): HasMany
    {
        return $this->hasMany(Rider::class);
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    public function admins(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function hasRiders(): bool
    {
        return $this->riders()->exists();
    }

    public function hasParcels(): bool
    {
        return $this->parcels()->exists();
    }
}
