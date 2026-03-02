<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Rider;
use Illuminate\Support\Facades\Hash;

echo "\n=== SmartRouteX Rider Account Fix ===\n\n";

// Check existing riders
$riders = Rider::all(['id','name','work_email','status','is_active','password']);
echo "📋 Existing riders:\n";
foreach ($riders as $r) {
    $hasPass = $r->password ? '✅ has password' : '❌ no password';
    $email   = $r->work_email ?? '(no work_email)';
    echo "   ID:{$r->id} | {$email} | status:{$r->status} | {$hasPass}\n";
}
echo "\n";

// Create or update test rider with work_email + password
$workEmail = 'rider@smartroutex.com';
$password  = 'rider123';

$rider = Rider::where('work_email', $workEmail)->first();

if (!$rider) {
    // Try to find existing rider by name and update it
    $rider = Rider::first();
    if ($rider) {
        $rider->update([
            'work_email' => $workEmail,
            'password'   => Hash::make($password),
            'status'     => Rider::STATUS_ACTIVE,
            'is_active'  => true,
            'must_change_password' => false,
        ]);
        echo "✅ Updated existing rider (ID: {$rider->id}) with work_email + password\n";
    } else {
        // Create fresh rider
        $rider = Rider::create([
            'name'                 => 'Ahmad Rider',
            'work_email'           => $workEmail,
            'password'             => Hash::make($password),
            'phone'                => '0123456789',
            'zone'                 => 'ZONE-A',
            'status'               => Rider::STATUS_ACTIVE,
            'is_active'            => true,
            'shift_active'         => false,
            'must_change_password' => false,
        ]);
        echo "✅ Created new rider (ID: {$rider->id})\n";
    }
} else {
    // Update existing
    $rider->update([
        'password'             => Hash::make($password),
        'status'               => Rider::STATUS_ACTIVE,
        'is_active'            => true,
        'must_change_password' => false,
    ]);
    echo "✅ Updated rider (ID: {$rider->id}) — password reset\n";
}

// Get machine local IP
$localIp = gethostbyname(gethostname());

echo "\n";
echo "╔══════════════════════════════════════════════════╗\n";
echo "║          RIDER LOGIN CREDENTIALS                 ║\n";
echo "╠══════════════════════════════════════════════════╣\n";
echo "║  📱 MOBILE APP LOGIN                             ║\n";
echo "║  Email:    {$workEmail}         ║\n";
echo "║  Password: {$password}                              ║\n";
echo "╠══════════════════════════════════════════════════╣\n";
echo "║  📡 BACKEND URL FOR MOBILE                       ║\n";
echo "║  Emulator Android: http://10.0.2.2:8000/api      ║\n";
echo "║  Physical Device:  http://{$localIp}:8000/api ║\n";
echo "║  Simulator iOS:    http://127.0.0.1:8000/api     ║\n";
echo "╚══════════════════════════════════════════════════╝\n\n";
