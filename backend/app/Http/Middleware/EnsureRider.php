<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures the authenticated user has an associated rider profile.
 */
class EnsureRider
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Rider login creates Sanctum tokens owned by Rider model directly
        if ($user instanceof \App\Models\Rider) {
            return $next($request);
        }

        // Fallback: User model with rider relationship
        if ($user->isRider() && $user->rider) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Rider profile not found.',
        ], 403);
    }
}
