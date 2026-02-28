<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHubRequest;
use App\Http\Requests\UpdateHubRequest;
use App\Models\Hub;
use App\Services\HubService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HubController extends Controller
{
    public function __construct(
        private readonly HubService $hubService,
    ) {}

    /**
     * GET /api/admin/hubs
     * Super Admin: paginated list with counts.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Hub::class);

        $result = $this->hubService->list(
            search: $request->query('q'),
            perPage: (int) $request->query('per_page', 20),
        );

        return response()->json($result);
    }

    /**
     * GET /api/admin/hubs/active
     * All active hubs for dropdowns (available to all admins).
     */
    public function active(): JsonResponse
    {
        return response()->json([
            'data' => $this->hubService->allActive(),
        ]);
    }

    /**
     * POST /api/admin/hubs
     */
    public function store(StoreHubRequest $request): JsonResponse
    {
        $hub = $this->hubService->create($request->validated());

        return response()->json([
            'ok'      => true,
            'message' => "Hub {$hub->code} created.",
            'hub'     => $hub,
        ], 201);
    }

    /**
     * PUT /api/admin/hubs/{hub}
     */
    public function update(UpdateHubRequest $request, Hub $hub): JsonResponse
    {
        $hub = $this->hubService->update($hub, $request->validated());

        return response()->json([
            'ok'  => true,
            'hub' => $hub,
        ]);
    }

    /**
     * DELETE /api/admin/hubs/{hub}
     */
    public function destroy(Hub $hub): JsonResponse
    {
        $this->authorize('delete', $hub);

        try {
            $this->hubService->delete($hub);
        } catch (\LogicException $e) {
            return response()->json([
                'ok'      => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json(['ok' => true, 'message' => "Hub {$hub->code} deleted."]);
    }
}
