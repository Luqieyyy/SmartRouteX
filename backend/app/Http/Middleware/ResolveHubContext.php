<?php

namespace App\Http\Middleware;

use App\Models\Hub;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves and validates the active hub context for the current request.
 *
 * - HUB_ADMIN: auto-sets hub context from user's assigned hub.
 * - SUPER_ADMIN: reads X-Hub-Id header or session fallback.
 * - Rejects HUB_ADMIN requests if user has no hub assigned.
 */
class ResolveHubContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // HUB_ADMIN must have a hub assigned
        if ($user->isHubAdmin()) {
            if (! $user->hub_id) {
                return response()->json([
                    'message' => 'No hub assigned to your account. Contact a Super Admin.',
                ], 403);
            }

            // Force hub context — override any header attempts
            $request->headers->set('X-Hub-Id', (string) $user->hub_id);
        }

        // SUPER_ADMIN: validate X-Hub-Id header if present
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
