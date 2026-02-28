<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Sanctum personal access tokens
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        // Users: add role (admin | rider)
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('admin')->after('email');
        });

        // Riders: link to users table for auth
        Schema::table('riders', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->boolean('shift_active')->default(false)->after('is_active');
        });

        // Rider locations: add missing GPS columns
        Schema::table('rider_locations', function (Blueprint $table) {
            $table->decimal('lat', 10, 7)->after('rider_id');
            $table->decimal('lng', 11, 7)->after('lat');
            $table->decimal('accuracy', 8, 2)->nullable()->after('lng');
            $table->decimal('speed', 8, 2)->nullable()->after('accuracy');
            $table->decimal('heading', 8, 2)->nullable()->after('speed');
        });

        // Parcels: add destination GPS
        Schema::table('parcels', function (Blueprint $table) {
            $table->decimal('recipient_lat', 10, 7)->nullable()->after('raw_address');
            $table->decimal('recipient_lng', 11, 7)->nullable()->after('recipient_lat');
        });

        // Delivery attempts: add GPS at delivery moment
        Schema::table('delivery_attempts', function (Blueprint $table) {
            $table->decimal('lat', 10, 7)->nullable()->after('pod_image_url');
            $table->decimal('lng', 11, 7)->nullable()->after('lat');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');

        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('role'));
        Schema::table('riders', fn (Blueprint $t) => $t->dropForeign(['user_id']));
        Schema::table('riders', fn (Blueprint $t) => $t->dropColumn(['user_id', 'shift_active']));
        Schema::table('rider_locations', fn (Blueprint $t) => $t->dropColumn(['lat', 'lng', 'accuracy', 'speed', 'heading']));
        Schema::table('parcels', fn (Blueprint $t) => $t->dropColumn(['recipient_lat', 'recipient_lng']));
        Schema::table('delivery_attempts', fn (Blueprint $t) => $t->dropColumn(['lat', 'lng']));
    }
};
