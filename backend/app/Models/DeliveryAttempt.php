<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryAttempt extends Model
{
    protected $fillable = [
        'parcel_id',
        'rider_id',
        'result',
        'note',
        'pod_image_url',
        'lat',
        'lng',
        'attempted_at',
    ];

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
            'lat' => 'float',
            'lng' => 'float',
        ];
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }
}
