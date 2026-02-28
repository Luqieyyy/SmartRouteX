<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $table->string('employment_type')->nullable()->after('zone');   // FULL_TIME, PART_TIME, CONTRACTOR, FREELANCER
            $table->string('warehouse')->nullable()->after('employment_type');
            $table->string('vehicle_type')->nullable()->after('warehouse'); // MOTORCYCLE, VAN, BICYCLE, CAR
            $table->string('vehicle_plate')->nullable()->after('vehicle_type');
            $table->unsignedSmallInteger('max_parcel_capacity')->nullable()->after('vehicle_plate');
            $table->time('shift_start')->nullable()->after('max_parcel_capacity');
            $table->time('shift_end')->nullable()->after('shift_start');
        });
    }

    public function down(): void
    {
        Schema::table('riders', function (Blueprint $table) {
            $table->dropColumn([
                'employment_type',
                'warehouse',
                'vehicle_type',
                'vehicle_plate',
                'max_parcel_capacity',
                'shift_start',
                'shift_end',
            ]);
        });
    }
};
