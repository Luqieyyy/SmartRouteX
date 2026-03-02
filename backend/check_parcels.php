<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parcels = App\Models\Parcel::all();
foreach ($parcels as $p) {
    echo "Parcel: " . $p->id . " | Rider: " . $p->assigned_rider_id . " | Status: " . $p->status . " | Zone: " . $p->zone_id . "\n";
}

$riders = App\Models\Rider::all();
foreach ($riders as $r) {
    echo "Rider: " . $r->id . " | Name: " . $r->name . "\n";
}
