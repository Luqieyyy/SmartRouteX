<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hub_id')->constrained('hubs')->cascadeOnDelete();
            $table->string('name');
            $table->string('code', 20);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['hub_id', 'code']);
            $table->index('hub_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
