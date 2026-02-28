<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ParcelController;
use App\Http\Controllers\Api\RiderAppController;
use App\Http\Controllers\Api\RiderController;
use App\Http\Controllers\Api\RouteOptimizationController;
use App\Http\Middleware\EnsureRider;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check
Route::get('/ping', fn () => response()->json(['ok' => true, 'timestamp' => now()]));

// ─── Authentication ───────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });
});

// ─── Rider Mobile App ─────────────────────────────────────────────────
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
Route::prefix('admin')->group(function () {

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

    // Riders
    Route::prefix('riders')->group(function () {
        Route::get('/',          [RiderController::class, 'index']);
        Route::post('/',         [RiderController::class, 'store']);
        Route::get('/{rider}',   [RiderController::class, 'show']);
        Route::put('/{rider}',   [RiderController::class, 'update']);
        Route::delete('/{rider}',[RiderController::class, 'destroy']);
    });
});