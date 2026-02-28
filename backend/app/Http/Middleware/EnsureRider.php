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

        if (! $user || ! $user->isRider() || ! $user->rider) {
            return response()->json([
                'message' => 'Rider profile not found.',
            ], 403);
        }

        return $next($request);
    }
}
