<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = $request->query('q');
        $zone = $request->query('zone');

        $riders = Rider::query()
            ->withCount(['parcels' => fn ($q) => $q->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])])
            ->with('latestLocation')
            ->when($q, fn ($query) => $query->where('name', 'ilike', "%{$q}%")
                                             ->orWhere('phone', 'ilike', "%{$q}%"))
            ->when($zone, fn ($query) => $query->where('zone', $zone))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($riders);
    }

    public function show(Rider $rider): JsonResponse
    {
        $rider->loadCount(['parcels' => fn ($q) => $q->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])]);
        $rider->load('latestLocation');

        return response()->json($rider);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:30'],
            'zone'      => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $rider = Rider::create([
            ...$data,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json(['ok' => true, 'rider' => $rider], 201);
    }

    public function update(Request $request, Rider $rider): JsonResponse
    {
        $data = $request->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:30'],
            'zone'      => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $rider->update($data);

        return response()->json(['ok' => true, 'rider' => $rider]);
    }

    public function destroy(Rider $rider): JsonResponse
    {
        $rider->delete();
        return response()->json(['ok' => true]);
    }
}
