<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$parcel = App\Models\Parcel::find(1);
echo "Lat: " . $parcel->recipient_lat . " | Lng: " . $parcel->recipient_lng . "\n";
