<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parcels', function (Blueprint $table) {
            $table->id();

            // Core identity
            $table->string('barcode', 100)->unique();
            $table->string('tracking_no', 100)->nullable();
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone', 30)->nullable();

            // Address
            $table->text('raw_address')->nullable();
            $table->string('zone', 100)->nullable();

            // Operations
            $table->string('priority', 30)->default('NORMAL');  // NORMAL | EXPRESS
            $table->string('status', 30)->default('CREATED');   // CREATED | ASSIGNED | IN_TRANSIT | DELIVERED | FAILED

            // Assignment
            $table->foreignId('assigned_rider_id')
                  ->nullable()
                  ->constrained('riders')
                  ->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};
