<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('zones', function (Blueprint $table) {
            $table->jsonb('zone_boundary')->nullable()->after('is_active');
            $table->string('color_code', 7)->default('#3B82F6')->after('zone_boundary');

            // Add unique constraint on hub_id + name (zone_code already unique per hub)
            $table->unique(['hub_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('zones', function (Blueprint $table) {
            $table->dropUnique(['hub_id', 'name']);
            $table->dropColumn(['zone_boundary', 'color_code']);
        });
    }
};
