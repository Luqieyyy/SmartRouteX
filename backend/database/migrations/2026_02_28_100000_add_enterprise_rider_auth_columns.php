<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enterprise Rider Authentication & Activation
     *
     * Adds work_email, password, status enum, lockout fields to riders table.
     * Creates rider_password_setups for one-time setup tokens.
     * Creates rider_audit_logs for security auditing.
     */
    public function up(): void
    {
        // ─── Upgrade riders table ──────────────────────────────────────
        Schema::table('riders', function (Blueprint $table) {
            $table->string('work_email')->nullable()->unique()->after('name');
            $table->string('password')->nullable()->after('work_email');
            $table->string('status', 20)->default('PENDING')->after('zone');
            $table->boolean('must_change_password')->default(true)->after('is_active');
            $table->timestamp('email_verified_at')->nullable()->after('must_change_password');
            $table->timestamp('last_login_at')->nullable()->after('email_verified_at');
            $table->unsignedInteger('failed_login_attempts')->default(0)->after('last_login_at');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            $table->unsignedBigInteger('created_by_admin_id')->nullable()->after('locked_until');

            $table->index('status');
            $table->index('work_email');
        });

        // ─── Password setup tokens (one-time activation links) ────────
        Schema::create('rider_password_setups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->constrained('riders')->cascadeOnDelete();
            $table->string('token_hash', 128)->index();
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // ─── Audit logs ───────────────────────────────────────────────
        Schema::create('rider_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->constrained('riders')->cascadeOnDelete();
            $table->string('action', 50);         // CREATED, UPDATED, STATUS_CHANGED, etc.
            $table->unsignedBigInteger('performed_by_admin_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->json('metadata')->nullable();  // extra context (old/new values etc.)
            $table->timestamp('created_at')->useCurrent();

            $table->index(['rider_id', 'created_at']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rider_audit_logs');
        Schema::dropIfExists('rider_password_setups');

        Schema::table('riders', function (Blueprint $table) {
            $table->dropIndex(['status']);
            // work_email unique index dropped automatically with column
            $table->dropColumn([
                'work_email',
                'password',
                'status',
                'must_change_password',
                'email_verified_at',
                'last_login_at',
                'failed_login_attempts',
                'locked_until',
                'created_by_admin_id',
            ]);
        });
    }
};
