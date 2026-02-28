<?php

use App\Http\Controllers\Api\AdminRiderController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\HubController;
use App\Http\Controllers\Api\ParcelController;
use App\Http\Controllers\Api\RiderAppController;
use App\Http\Controllers\Api\RiderAuthController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\RouteOptimizationController;
use App\Http\Controllers\Api\ZoneController;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureRider;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\ResolveHubContext;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/ping', fn () => response()->json(['ok' => true, 'timestamp' => now()]));

// ─── Admin Authentication ─────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });
});

// ─── Rider Authentication (public endpoints) ─────────────────────────
Route::prefix('rider')->group(function () {
    Route::post('/setup-password',  [RiderAuthController::class, 'setupPassword'])
        ->middleware('throttle:5,1');  // 5 attempts per minute

    Route::post('/login', [RiderAuthController::class, 'login'])
        ->middleware('throttle:10,1'); // 10 attempts per minute

    Route::get('/validate-token', [RiderAuthController::class, 'validateToken'])
        ->middleware('throttle:10,1');
});

// ─── Rider Protected (auth required via Sanctum) ─────────────────────
Route::prefix('rider')
    ->middleware(['auth:sanctum'])
    ->group(function () {
        Route::post('/logout', [RiderAuthController::class, 'logout']);
        Route::get('/me',      [RiderAuthController::class, 'me']);
    });

// ─── Rider Mobile App (legacy + operational endpoints) ────────────────
Route::prefix('rider')
    ->middleware(['auth:sanctum', EnsureRider::class])
    ->group(function () {
        // Profile & Shift
        Route::get('/profile',   [RiderAppController::class, 'profile']);
        Route::patch('/profile', [RiderAppController::class, 'updateProfile']);

        // GPS Location
        Route::post('/location', [RiderAppController::class, 'storeLocation']);

        // Parcels
        Route::get('/parcels',            [RiderAppController::class, 'parcels']);
        Route::post('/parcels/claim',     [RiderAppController::class, 'claim']);
        Route::post('/parcels/scan',      [RiderAppController::class, 'scan']);
        Route::post('/parcels/{parcel}/pod',  [RiderAppController::class, 'pod']);
        Route::post('/parcels/{parcel}/fail', [RiderAppController::class, 'fail']);

        // Route Optimization
        Route::post('/route/suggest', [RouteOptimizationController::class, 'suggest']);
    });

// ─── Admin Dashboard ─────────────────────────────────────────────────
Route::prefix('admin')
    ->middleware(['auth:sanctum', EnsureAdmin::class, ResolveHubContext::class])
    ->group(function () {

    // Hub switching (Super Admin only)
    Route::post('/switch-hub', [AuthController::class, 'switchHub']);

    // Hubs (Super Admin only for CUD, active list for all admins)
    Route::prefix('hubs')->group(function () {
        Route::get('/active', [HubController::class, 'active']);
        Route::get('/',       [HubController::class, 'index'])->middleware(EnsureSuperAdmin::class);
        Route::post('/',      [HubController::class, 'store'])->middleware(EnsureSuperAdmin::class);
        Route::put('/{hub}',  [HubController::class, 'update'])->middleware(EnsureSuperAdmin::class);
        Route::delete('/{hub}', [HubController::class, 'destroy'])->middleware(EnsureSuperAdmin::class);
    });

    // Zones (scoped by hub context)
    Route::prefix('zones')->group(function () {
        Route::get('/active',    [ZoneController::class, 'active']);
        Route::get('/',          [ZoneController::class, 'index']);
        Route::post('/',         [ZoneController::class, 'store']);
        Route::put('/{zone}',    [ZoneController::class, 'update']);
        Route::delete('/{zone}', [ZoneController::class, 'destroy']);
    });

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats',   [DashboardController::class, 'stats']);
        Route::get('/by-zone', [DashboardController::class, 'byZone']);
        Route::get('/trend',   [DashboardController::class, 'trend']);
    });

    // Parcels
    Route::prefix('parcels')->group(function () {
        Route::get('/',            [ParcelController::class, 'index']);
        Route::post('/',           [ParcelController::class, 'store']);
        Route::post('/import',     [ParcelController::class, 'importCsv']);
        Route::get('/{parcel}',    [ParcelController::class, 'show']);
        Route::put('/{parcel}',    [ParcelController::class, 'update']);
        Route::delete('/{parcel}', [ParcelController::class, 'destroy']);
    });

    // Riders (enterprise management with activation emails)
    Route::prefix('riders')->group(function () {
        Route::get('/',          [AdminRiderController::class, 'index']);
        Route::post('/',         [AdminRiderController::class, 'store']);
        Route::get('/{rider}',   [AdminRiderController::class, 'show']);
        Route::put('/{rider}',   [AdminRiderController::class, 'update']);
        Route::delete('/{rider}',[AdminRiderController::class, 'destroy']);
        Route::post('/{rider}/resend-setup-email', [AdminRiderController::class, 'resendSetupEmail']);
    });
});