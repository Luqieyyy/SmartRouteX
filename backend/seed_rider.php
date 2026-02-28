<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$existing = App\Models\User::where('email', 'rider@test.com')->first();
if ($existing) {
    // Check if rider record exists
    $rider = App\Models\Rider::where('user_id', $existing->id)->first();
    if (!$rider) {
        $rider = App\Models\Rider::create([
            'name'         => 'Test Rider',
            'user_id'      => $existing->id,
            'phone'        => '0123456789',
            'zone'         => 'ZONE-A',
            'shift_active' => false,
            'is_active'    => true,
        ]);
        echo "Rider record created (ID: {$rider->id})\n";
    } else {
        echo "Rider record exists (ID: {$rider->id})\n";
    }
    echo "=============================\n";
    echo "Email:    rider@test.com\n";
    echo "Password: password123\n";
    echo "=============================\n";
    exit(0);
}

$user = App\Models\User::create([
    'name'     => 'Test Rider',
    'email'    => 'rider@test.com',
    'password' => bcrypt('password123'),
    'role'     => 'rider',
]);

$rider = App\Models\Rider::create([
    'name'          => 'Test Rider',
    'user_id'       => $user->id,
    'phone'         => '0123456789',
    'zone'          => 'ZONE-A',
    'shift_active'  => false,
    'is_active'     => true,
]);

echo "=============================\n";
echo "Test rider account created!\n";
echo "Email:    rider@test.com\n";
echo "Password: password123\n";
echo "User ID:  {$user->id}\n";
echo "Rider ID: {$rider->id}\n";
echo "=============================\n";
