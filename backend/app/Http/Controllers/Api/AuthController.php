<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hub;
use App\Models\User;
use App\Services\HubAccessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly HubAccessService $hubAccessService,
    ) {}

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        // Revoke previous tokens for this device
        $user->tokens()->where('name', 'mobile')->delete();

        $token = $user->createToken('mobile')->plainTextToken;

        $payload = [
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->formatUser($user),
            'hub_context'  => $this->hubAccessService->buildHubContext($user),
        ];

        // Include rider profile if user is a rider
        if ($user->isRider() && $user->rider) {
            $payload['rider'] = $user->rider;
        }

        return response()->json($payload);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->formatUser($user);
        $data['hub_context'] = $this->hubAccessService->buildHubContext($user);

        if ($user->isRider() && $user->rider) {
            $data['rider'] = $user->rider->load('latestLocation');
        }

        return response()->json($data);
    }

    /**
     * POST /api/admin/switch-hub
     * SUPER_ADMIN and REGIONAL_MANAGER only.
     */
    public function switchHub(Request $request): JsonResponse
    {
        $request->validate([
            'hub_id' => ['nullable', 'integer'],
        ]);

        $user = $request->user();

        if (! $user->canSwitchHub()) {
            return response()->json([
                'message' => 'Your role does not allow hub switching.',
            ], 403);
        }

        $hubId = $request->input('hub_id');

        // Allow clearing (global view) for SUPER_ADMIN only
        if ($hubId === null) {
            if (! $user->isSuperAdmin()) {
                return response()->json([
                    'message' => 'Only Super Admins can view all hubs globally.',
                ], 403);
            }

            return response()->json([
                'ok'            => true,
                'message'       => 'Switched to global view (all hubs).',
                'hub'           => null,
                'active_hub_id' => null,
            ]);
        }

        // Validate hub exists
        $hub = Hub::where('id', $hubId)->where('is_active', true)->first();
        if (! $hub) {
            return response()->json([
                'message' => 'Invalid or inactive hub.',
            ], 422);
        }

        // REGIONAL_MANAGER: must have access
        if ($user->isRegionalManager() && ! $user->canAccessHub($hub->id)) {
            return response()->json([
                'message' => 'You do not have access to this hub.',
            ], 403);
        }

        return response()->json([
            'ok'            => true,
            'message'       => "Switched to hub: {$hub->name} ({$hub->code})",
            'hub'           => $hub,
            'active_hub_id' => $hub->id,
        ]);
    }

    /**
     * GET /api/admin/hub-context
     * Returns the hub context for the current user — used by the frontend
     * hub selector to refresh available hubs without a full /me call.
     */
    public function hubContext(Request $request): JsonResponse
    {
        return response()->json(
            $this->hubAccessService->buildHubContext($request->user())
        );
    }

    /**
     * Format user payload with hub + role info.
     */
    private function formatUser(User $user): array
    {
        $data = [
            'id'    => $user->id,
            'name'  => $user->name,
            'email' => $user->email,
            'role'  => $user->role,
        ];

        if ($user->hub_id) {
            $user->load('hub:id,name,code');
            $data['hub_id'] = $user->hub_id;
            $data['hub']    = $user->hub;
        }

        return $data;
    }
}
