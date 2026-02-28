<?php

namespace App\Providers;

use App\Models\Hub;
use App\Models\Zone;
use App\Policies\HubPolicy;
use App\Policies\ZonePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Hub::class, HubPolicy::class);
        Gate::policy(Zone::class, ZonePolicy::class);
    }
}
