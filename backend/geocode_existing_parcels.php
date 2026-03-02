<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$geocodingService = app(\App\Services\GeocodingService::class);
$parcels = App\Models\Parcel::whereNull('recipient_lat')->get();

foreach ($parcels as $p) {
    if ($p->raw_address) {
        echo "Geocoding ID: " . $p->id . " Address: " . $p->raw_address . "\n";
        $coords = $geocodingService->geocode($p->raw_address);
        if ($coords) {
            $p->recipient_lat = $coords['lat'];
            $p->recipient_lng = $coords['lng'];
            $p->save();
            echo "   -> Success: " . $p->recipient_lat . ", " . $p->recipient_lng . "\n";
        } else {
             echo "   -> Failed.\n";
        }
    }
}
echo "Done.\n";
