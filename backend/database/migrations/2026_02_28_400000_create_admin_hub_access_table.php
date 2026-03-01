<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-hub access control.
 *
 * Roles: SUPER_ADMIN, REGIONAL_MANAGER, HUB_ADMIN, STAFF
 *
 * SUPER_ADMIN:        sees all hubs, no entries needed in this table.
 * REGIONAL_MANAGER:   multiple rows – one per allowed hub.
 * HUB_ADMIN:          single row – locked to one hub.
 * STAFF:              single row – locked to one hub (read-restricted).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_hub_access', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('hub_id')
                  ->constrained('hubs')
                  ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['admin_id', 'hub_id']);
            $table->index('hub_id');
        });

        // Add new roles to users table — update existing role column
        // Add REGIONAL_MANAGER and STAFF as valid roles
        // (role is a string column, no enum migration needed)
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_hub_access');
    }
};
