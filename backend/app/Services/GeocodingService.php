<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodingService
{
    /**
     * Geocode a raw address into lat/lng array.
     */
    public function geocode(string $address): ?array
    {
        $apiKey = env('GOOGLE_MAPS_API_KEY');
        
        if (empty($apiKey)) {
            Log::warning('Geocoding missed: GOOGLE_MAPS_API_KEY not configured.');
            return null;
        }

        try {
            $response = Http::get('https://maps.googleapis.com/maps/api/geocode/json', [
                'address' => $address,
                'key' => $apiKey,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['status']) && $data['status'] === 'OK' && !empty($data['results'])) {
                    $location = $data['results'][0]['geometry']['location'];
                    return [
                        'lat' => $location['lat'],
                        'lng' => $location['lng'],
                    ];
                } else {
                    Log::warning("Geocoding failed for: $address", ['status' => $data['status'] ?? 'UNKNOWN']);
                }
            } else {
                Log::error("Geocoding API HTTP error", ['status' => $response->status()]);
            }
        } catch (\Exception $e) {
            Log::error("Geocoding exception: " . $e->getMessage());
        }

        return null;
    }
}
