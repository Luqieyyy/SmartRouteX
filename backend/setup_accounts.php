<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Rider;
use Illuminate\Support\Facades\Hash;

echo "\n=== SmartRouteX Account Setup ===\n\n";

// ─── Show existing users ───────────────────────────────────────
echo "📋 EXISTING ACCOUNTS:\n";
$users = User::all(['id','name','email','role']);
foreach ($users as $u) {
    echo "   ID:{$u->id} | {$u->email} | role:{$u->role}\n";
}
echo "\n";

// ─── Create SUPER ADMIN ───────────────────────────────────────
$adminEmail = 'admin@smartroutex.com';
$adminExists = User::where('email', $adminEmail)->exists();
if (!$adminExists) {
    User::create([
        'name'     => 'Super Admin',
        'email'    => $adminEmail,
        'password' => Hash::make('admin123'),
        'role'     => 'SUPER_ADMIN',
    ]);
    echo "✅ SUPER ADMIN created!\n";
} else {
    // Update password jika dah ada
    User::where('email', $adminEmail)->update([
        'password' => Hash::make('admin123'),
        'role'     => 'SUPER_ADMIN',
    ]);
    echo "ℹ️  SUPER ADMIN already exists (password reset to admin123)\n";
}

// ─── Create HUB ADMIN ─────────────────────────────────────────
$hubAdminEmail = 'hubadmin@smartroutex.com';
if (!User::where('email', $hubAdminEmail)->exists()) {
    User::create([
        'name'     => 'Hub Admin',
        'email'    => $hubAdminEmail,
        'password' => Hash::make('admin123'),
        'role'     => 'HUB_ADMIN',
    ]);
    echo "✅ HUB ADMIN created!\n";
} else {
    User::where('email', $hubAdminEmail)->update(['password' => Hash::make('admin123')]);
    echo "ℹ️  HUB ADMIN already exists (password reset)\n";
}

// Also fix test@example.com role if wrong
$testUser = User::where('email', 'test@example.com')->first();
if ($testUser && $testUser->role !== 'SUPER_ADMIN') {
    $testUser->update(['role' => 'SUPER_ADMIN', 'name' => 'Admin Test']);
    echo "🔧 Fixed test@example.com role → SUPER_ADMIN\n";
}

// ─── Create RIDER account ─────────────────────────────────────
$riderEmail = 'rider@smartroutex.com';
$riderUser  = User::where('email', $riderEmail)->first();
if (!$riderUser) {
    $riderUser = User::create([
        'name'     => 'Ahmad Rider',
        'email'    => $riderEmail,
        'password' => Hash::make('rider123'),
        'role'     => 'rider',
    ]);
    echo "✅ RIDER user created!\n";
} else {
    $riderUser->update(['password' => Hash::make('rider123')]);
    echo "ℹ️  RIDER user already exists (password reset)\n";
}

// Create Rider profile if not exists
$riderProfile = Rider::where('user_id', $riderUser->id)->first();
if (!$riderProfile) {
    Rider::create([
        'name'         => 'Ahmad Rider',
        'user_id'      => $riderUser->id,
        'phone'        => '0123456789',
        'zone'         => 'ZONE-A',
        'shift_active' => false,
        'is_active'    => true,
    ]);
    echo "✅ RIDER profile created!\n";
} else {
    echo "ℹ️  RIDER profile already exists (ID: {$riderProfile->id})\n";
}

// Also fix existing rider@test.com
$existingRider = User::where('email', 'rider@test.com')->first();
if ($existingRider) {
    $existingRider->update(['password' => Hash::make('password123')]);
}

echo "\n";
echo "╔══════════════════════════════════════════════════╗\n";
echo "║            SMARTROUTEX LOGIN CREDENTIALS         ║\n";
echo "╠══════════════════════════════════════════════════╣\n";
echo "║  🖥️  ADMIN (Next.js Frontend)                    ║\n";
echo "║  Email:    admin@smartroutex.com                 ║\n";
echo "║  Password: admin123                              ║\n";
echo "║  Role:     SUPER_ADMIN                           ║\n";
echo "╠══════════════════════════════════════════════════╣\n";
echo "║  🖥️  ADMIN (alternative / original)              ║\n";
echo "║  Email:    test@example.com                      ║\n";
echo "║  Password: password                              ║\n";
echo "╠══════════════════════════════════════════════════╣\n";
echo "║  📱 RIDER (Flutter Mobile App)                   ║\n";
echo "║  Email:    rider@smartroutex.com                 ║\n";
echo "║  Password: rider123                              ║\n";
echo "╠══════════════════════════════════════════════════╣\n";
echo "║  📱 RIDER (original seed)                        ║\n";
echo "║  Email:    rider@test.com                        ║\n";
echo "║  Password: password123                           ║\n";
echo "╚══════════════════════════════════════════════════╝\n";
echo "\n";
echo "Backend URL: http://127.0.0.1:8000\n";
echo "Frontend URL: http://localhost:3000\n\n";
