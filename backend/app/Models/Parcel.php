<?php

namespace App\Models;

use App\Models\Traits\BelongsToHub;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcel extends Model
{
    use BelongsToHub;

    protected $fillable = [
        'hub_id',
        'zone_id',
        'barcode',
        'tracking_no',
        'recipient_name',
        'recipient_phone',
        'raw_address',
        'recipient_lat',
        'recipient_lng',
        'zone',
        'priority',
        'status',
        'assigned_rider_id',
        'assigned_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'recipient_lat' => 'float',
            'recipient_lng' => 'float',
        ];
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class, 'assigned_rider_id');
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function assignedZone(): BelongsTo
    {
        return $this->belongsTo(Zone::class, 'zone_id');
    }

    public function deliveryAttempts(): HasMany
    {
        return $this->hasMany(DeliveryAttempt::class);
    }
}