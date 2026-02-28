<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Rider extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'zone',
        'is_active',
        'shift_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'shift_active' => 'boolean',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
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
}
