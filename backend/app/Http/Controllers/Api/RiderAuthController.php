<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\RiderAuditLog;
use App\Models\RiderPasswordSetup;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class RiderAuthController extends Controller
{
    /**
     * POST /api/rider/setup-password
     *
     * First-time password setup via one-time token link.
     * Sets password, activates rider, returns Sanctum token.
     */
    public function setupPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'                 => ['required', 'string', 'size:64'],
            'password'              => ['required', 'string', 'confirmed', new StrongPassword],
        ]);

        // Look up the token
        $setup = RiderPasswordSetup::findByRawToken($request->token);

        if (! $setup) {
            throw ValidationException::withMessages([
                'token' => ['This setup link is invalid or has expired. Please contact your administrator to resend.'],
            ]);
        }

        $rider = $setup->rider;

        // Set password & activate
        $rider->update([
            'password'              => $request->password, // cast 'hashed' handles Hash::make
            'status'                => Rider::STATUS_ACTIVE,
            'is_active'             => true,
            'must_change_password'  => false,
            'email_verified_at'     => $rider->email_verified_at ?? now(),
            'last_login_at'         => now(),
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);

        // Mark token as used
        $setup->markUsed();

        // Audit
        RiderAuditLog::log($rider, RiderAuditLog::ACTION_PASSWORD_SET, null, $request->ip());

        // Issue Sanctum token
        $token = $rider->createToken('rider-mobile')->plainTextToken;

        return response()->json([
            'ok'           => true,
            'message'      => 'Password set successfully. Your account is now active.',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'rider'        => [
                'id'         => $rider->id,
                'name'       => $rider->name,
                'work_email' => $rider->work_email,
                'status'     => $rider->status,
            ],
        ]);
    }

    /**
     * POST /api/rider/login
     *
     * Rider login with work_email + password.
     * Handles lockout after 5 failed attempts (15 min cooldown).
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'work_email' => ['required', 'email'],
            'password'   => ['required', 'string'],
        ]);

        $rider = Rider::where('work_email', $request->work_email)->first();

        if (! $rider) {
            throw ValidationException::withMessages([
                'work_email' => ['Invalid credentials.'],
            ]);
        }

        // Check status
        if (! $rider->isActive()) {
            $statusMessages = [
                Rider::STATUS_PENDING     => 'Your account has not been activated yet. Please check your email for the setup link.',
                Rider::STATUS_SUSPENDED   => 'Your account has been suspended. Please contact your administrator.',
                Rider::STATUS_DEACTIVATED => 'Your account has been deactivated. Please contact your administrator.',
            ];

            return response()->json([
                'message' => $statusMessages[$rider->status] ?? 'Account not active.',
            ], 403);
        }

        // Check lockout
        if ($rider->isLockedOut()) {
            $retryAfter = $rider->locked_until->diffInSeconds(now());

            RiderAuditLog::log($rider, RiderAuditLog::ACTION_LOGIN_FAILED, null, $request->ip(), [
                'reason' => 'account_locked',
            ]);

            return response()->json([
                'message'     => 'Account temporarily locked due to too many failed attempts. Please try again later.',
                'retry_after' => $retryAfter,
                'locked_until' => $rider->locked_until->toIso8601String(),
            ], 429);
        }

        // Verify password
        if (! Hash::check($request->password, $rider->password)) {
            $rider->incrementFailedAttempts();

            RiderAuditLog::log($rider, RiderAuditLog::ACTION_LOGIN_FAILED, null, $request->ip(), [
                'reason'          => 'invalid_password',
                'failed_attempts' => $rider->failed_login_attempts,
            ]);

            throw ValidationException::withMessages([
                'work_email' => ['Invalid credentials.'],
            ]);
        }

        // Check must_change_password
        if ($rider->must_change_password) {
            return response()->json([
                'message' => 'You must complete the initial password setup first. Check your email for the activation link.',
                'must_change_password' => true,
            ], 403);
        }

        // Success — reset attempts, issue token
        $rider->resetFailedAttempts();

        // Revoke previous tokens
        $rider->tokens()->where('name', 'rider-mobile')->delete();

        $token = $rider->createToken('rider-mobile')->plainTextToken;

        RiderAuditLog::log($rider, RiderAuditLog::ACTION_LOGIN_SUCCESS, null, $request->ip());

        return response()->json([
            'ok'           => true,
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'rider'        => [
                'id'         => $rider->id,
                'name'       => $rider->name,
                'work_email' => $rider->work_email,
                'phone'      => $rider->phone,
                'zone'       => $rider->zone,
                'status'     => $rider->status,
            ],
        ]);
    }

    /**
     * POST /api/rider/logout
     * Revoke current Sanctum token.
     */
    public function logout(Request $request): JsonResponse
    {
        $rider = $request->user();

        $request->user()->currentAccessToken()->delete();

        if ($rider instanceof Rider) {
            RiderAuditLog::log($rider, RiderAuditLog::ACTION_LOGOUT, null, $request->ip());
        }

        return response()->json(['ok' => true, 'message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/rider/me
     * Get current rider profile.
     */
    public function me(Request $request): JsonResponse
    {
        $rider = $request->user();

        if (! $rider instanceof Rider) {
            return response()->json(['message' => 'Rider profile not found.'], 404);
        }

        $rider->load('latestLocation');

        return response()->json([
            'id'         => $rider->id,
            'name'       => $rider->name,
            'work_email' => $rider->work_email,
            'phone'      => $rider->phone,
            'zone'       => $rider->zone,
            'status'     => $rider->status,
            'is_active'  => $rider->is_active,
            'last_login_at'      => $rider->last_login_at?->toIso8601String(),
            'email_verified_at'  => $rider->email_verified_at?->toIso8601String(),
            'latest_location'    => $rider->latestLocation,
        ]);
    }

    /**
     * GET /api/rider/validate-token
     * Validate a setup token (used by frontend setup-password page).
     */
    public function validateToken(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string', 'size:64'],
        ]);

        $setup = RiderPasswordSetup::findByRawToken($request->token);

        if (! $setup) {
            return response()->json([
                'valid' => false,
                'message' => 'This setup link is invalid or has expired.',
            ], 422);
        }

        return response()->json([
            'valid' => true,
            'rider' => [
                'name'       => $setup->rider->name,
                'work_email' => $setup->rider->work_email,
            ],
        ]);
    }
}
