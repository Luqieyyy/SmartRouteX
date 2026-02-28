<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // --- Users: add role enum + hub_id ---
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role', 30)->default('admin')->after('password');
            }
            $table->foreignId('hub_id')->nullable()->after('role')
                  ->constrained('hubs')->nullOnDelete();
        });

        // --- Riders: add hub_id + zone_id ---
        Schema::table('riders', function (Blueprint $table) {
            $table->foreignId('hub_id')->nullable()->after('id')
                  ->constrained('hubs')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->after('hub_id')
                  ->constrained('zones')->nullOnDelete();
        });

        // --- Parcels: add hub_id + zone_id ---
        Schema::table('parcels', function (Blueprint $table) {
            $table->foreignId('hub_id')->nullable()->after('id')
                  ->constrained('hubs')->nullOnDelete();
            $table->foreignId('zone_id')->nullable()->after('hub_id')
                  ->constrained('zones')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('parcels', function (Blueprint $table) {
            $table->dropConstrainedForeignId('zone_id');
            $table->dropConstrainedForeignId('hub_id');
        });

        Schema::table('riders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('zone_id');
            $table->dropConstrainedForeignId('hub_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hub_id');
        });
    }
};
