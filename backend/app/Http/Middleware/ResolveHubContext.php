<?php

namespace App\Http\Middleware;

use App\Models\Hub;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves and validates the active hub context for the current request.
 *
 * Security layer: even if the frontend sends an X-Hub-Id header, this
 * middleware validates that the authenticated admin is allowed to access it.
 *
 * - SUPER_ADMIN:        any active hub, or none (global view).
 * - REGIONAL_MANAGER:   only hubs in admin_hub_access pivot.
 * - HUB_ADMIN / STAFF:  locked to their single assigned hub.
 */
class ResolveHubContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // ── HUB_ADMIN / STAFF: locked to single hub ──────────────
        if ($user->isHubAdmin() || $user->isStaff()) {
            if (! $user->hub_id) {
                return response()->json([
                    'message' => 'No hub assigned to your account. Contact a Super Admin.',
                ], 403);
            }

            // Force hub context — override any header manipulation
            $request->headers->set('X-Hub-Id', (string) $user->hub_id);

            return $next($request);
        }

        // ── REGIONAL_MANAGER: validate against allowed hubs ──────
        if ($user->isRegionalManager()) {
            $headerHub = $request->header('X-Hub-Id');

            if ($headerHub && is_numeric($headerHub)) {
                $hubId = (int) $headerHub;

                if (! $user->canAccessHub($hubId)) {
                    return response()->json([
                        'message' => 'You do not have access to this hub.',
                    ], 403);
                }

                // Validate hub is active
                $exists = Hub::where('id', $hubId)
                    ->where('is_active', true)
                    ->exists();

                if (! $exists) {
                    return response()->json([
                        'message' => 'Invalid or inactive hub selected.',
                    ], 422);
                }
            }
            // If no header → scoping will use all allowed hubs (via HubScope)

            return $next($request);
        }

        // ── SUPER_ADMIN: validate hub exists if header present ───
        if ($user->isSuperAdmin()) {
            $headerHub = $request->header('X-Hub-Id');

            if ($headerHub && is_numeric($headerHub)) {
                $exists = Hub::where('id', (int) $headerHub)
                    ->where('is_active', true)
                    ->exists();

                if (! $exists) {
                    return response()->json([
                        'message' => 'Invalid or inactive hub selected.',
                    ], 422);
                }
            }
        }

        return $next($request);
    }
}
