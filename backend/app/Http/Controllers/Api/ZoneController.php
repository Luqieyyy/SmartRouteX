<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreZoneRequest;
use App\Http\Requests\UpdateZoneRequest;
use App\Models\Scopes\HubScope;
use App\Models\Zone;
use App\Services\ZoneDetectionService;
use App\Services\ZoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ZoneController extends Controller
{
    public function __construct(
        private readonly ZoneService $zoneService,
        private readonly ZoneDetectionService $zoneDetection,
    ) {}

    /**
     * GET /api/admin/zones
     * Zone list (auto-scoped by hub).
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Zone::class);

        $result = $this->zoneService->list(
            search: $request->query('q'),
            hubId: $request->query('hub_id') ? (int) $request->query('hub_id') : null,
            perPage: (int) $request->query('per_page', 20),
        );

        return response()->json($result);
    }

    /**
     * GET /api/admin/zones/active
     * Active zones for dropdowns (scoped by hub context).
     */
    public function active(Request $request): JsonResponse
    {
        $hubId = $request->query('hub_id') ? (int) $request->query('hub_id') : null;

        return response()->json([
            'data' => $this->zoneService->activeForHub($hubId),
        ]);
    }

    /**
     * GET /api/admin/zones/boundaries
     * Returns all zone polygons for the current hub context.
     * Lightweight payload for map rendering (Live Tracking & Settings).
     */
    public function boundaries(Request $request): JsonResponse
    {
        $hubId = $request->query('hub_id')
            ? (int) $request->query('hub_id')
            : HubScope::resolveHubId();

        if (! $hubId) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => $this->zoneDetection->getBoundariesForHub($hubId),
        ]);
    }

    /**
     * POST /api/admin/zones
     */
    public function store(StoreZoneRequest $request): JsonResponse
    {
        $this->authorize('create', Zone::class);

        try {
            $zone = $this->zoneService->create(
                data: $request->validated(),
                hubId: $request->input('hub_id'),
            );

            // Invalidate boundary cache for this hub
            $this->zoneDetection->invalidateCache($zone->hub_id);
        } catch (\LogicException $e) {
            return response()->json([
                'ok'      => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'ok'      => true,
            'message' => "Zone {$zone->code} created.",
            'zone'    => $zone->load('hub:id,name,code'),
        ], 201);
    }

    /**
     * PUT /api/admin/zones/{zone}
     */
    public function update(UpdateZoneRequest $request, Zone $zone): JsonResponse
    {
        $this->authorize('update', $zone);

        $zone = $this->zoneService->update($zone, $request->validated());

        // Invalidate boundary cache for this hub
        $this->zoneDetection->invalidateCache($zone->hub_id);

        return response()->json([
            'ok'   => true,
            'zone' => $zone->load('hub:id,name,code'),
        ]);
    }

    /**
     * DELETE /api/admin/zones/{zone}
     */
    public function destroy(Zone $zone): JsonResponse
    {
        $this->authorize('delete', $zone);

        $hubId = $zone->hub_id;

        try {
            $this->zoneService->delete($zone);
        } catch (\LogicException $e) {
            return response()->json([
                'ok'      => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        // Invalidate boundary cache for this hub
        $this->zoneDetection->invalidateCache($hubId);

        return response()->json(['ok' => true, 'message' => "Zone {$zone->code} deleted."]);
    }
}
