<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hub;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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

        if ($user->isRider() && $user->rider) {
            $data['rider'] = $user->rider->load('latestLocation');
        }

        return response()->json($data);
    }

    /**
     * POST /api/admin/switch-hub
     * Super Admin only — set the active hub context.
     */
    public function switchHub(Request $request): JsonResponse
    {
        $request->validate([
            'hub_id' => ['required', 'integer', 'exists:hubs,id'],
        ]);

        $user = $request->user();

        if (! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only Super Admins can switch hub context.',
            ], 403);
        }

        $hub = Hub::find($request->input('hub_id'));

        return response()->json([
            'ok'      => true,
            'message' => "Switched to hub: {$hub->name} ({$hub->code})",
            'hub'     => $hub,
        ]);
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
