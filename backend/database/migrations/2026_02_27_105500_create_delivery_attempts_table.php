<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('delivery_attempts', function (Blueprint $table) {
    $table->id();

    $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
    $table->foreignId('rider_id')->nullable()->constrained('riders')->nullOnDelete();

    $table->string('result', 30); // DELIVERED / FAILED
    $table->text('note')->nullable();
    $table->string('pod_image_url')->nullable(); // later store in S3/Firebase/etc

    $table->timestamp('attempted_at')->useCurrent();

    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_attempts');
    }
};
