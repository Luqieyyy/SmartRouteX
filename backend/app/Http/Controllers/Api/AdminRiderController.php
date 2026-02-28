<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RiderSetupPasswordMail;
use App\Models\Rider;
use App\Models\RiderAuditLog;
use App\Models\RiderPasswordSetup;
use App\Models\Scopes\HubScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

class AdminRiderController extends Controller
{
    /**
     * GET /api/admin/riders
     * List riders with pagination, search, and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $q    = $request->query('q');
        $zone = $request->query('zone');
        $zoneId = $request->query('zone_id');
        $status = $request->query('status');

        $riders = Rider::query()
            ->withCount(['parcels' => fn ($qb) => $qb->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])])
            ->with(['latestLocation', 'hub:id,name,code', 'assignedZone:id,name,code'])
            ->when($q, fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('work_email', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
            }))
            ->when($zone, fn ($query) => $query->where('zone', $zone))
            ->when($zoneId, fn ($query) => $query->where('zone_id', $zoneId))
            ->when($status, fn ($query) => $query->where('status', $status))
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($riders);
    }

    /**
     * GET /api/admin/riders/{rider}
     */
    public function show(Rider $rider): JsonResponse
    {
        $rider->loadCount(['parcels' => fn ($q) => $q->whereIn('status', ['ASSIGNED', 'IN_TRANSIT'])]);
        $rider->load('latestLocation');

        return response()->json($rider);
    }

    /**
     * POST /api/admin/riders
     * Create rider + send setup email with one-time token link.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'work_email'          => ['required', 'email', 'max:255', 'unique:riders,work_email'],
            'phone'               => ['nullable', 'string', 'max:30'],
            'zone'                => ['nullable', 'string', 'max:100'],
            'zone_id'             => ['nullable', 'integer', 'exists:zones,id'],
            'employment_type'     => ['nullable', 'string', 'max:50'],
            'warehouse'           => ['nullable', 'string', 'max:255'],
            'vehicle_type'        => ['nullable', 'string', 'max:50'],
            'vehicle_plate'       => ['nullable', 'string', 'max:20'],
            'max_parcel_capacity' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'shift_start'         => ['nullable', 'date_format:H:i'],
            'shift_end'           => ['nullable', 'date_format:H:i'],
        ]);

        $admin = $request->user();
        $hubId = HubScope::resolveHubId() ?? $admin->hub_id;

        $rider = Rider::withoutHubScope()->create([
            'hub_id'              => $hubId,
            'zone_id'             => $data['zone_id'] ?? null,
            'name'                => $data['name'],
            'work_email'          => $data['work_email'],
            'phone'               => $data['phone'] ?? null,
            'zone'                => $data['zone'] ?? null,
            'employment_type'     => $data['employment_type'] ?? null,
            'warehouse'           => $data['warehouse'] ?? null,
            'vehicle_type'        => $data['vehicle_type'] ?? null,
            'vehicle_plate'       => $data['vehicle_plate'] ?? null,
            'max_parcel_capacity' => $data['max_parcel_capacity'] ?? null,
            'shift_start'         => $data['shift_start'] ?? null,
            'shift_end'           => $data['shift_end'] ?? null,
            'status'              => Rider::STATUS_PENDING,
            'is_active'           => false,
            'must_change_password' => true,
            'created_by_admin_id' => $admin?->id,
        ]);

        // Audit: created
        RiderAuditLog::log($rider, RiderAuditLog::ACTION_CREATED, $admin?->id, $request->ip());

        // Generate token & send email
        $rawToken = RiderPasswordSetup::generateFor($rider);
        $this->sendSetupEmail($rider, $rawToken);

        // Audit: setup email sent
        RiderAuditLog::log($rider, RiderAuditLog::ACTION_SETUP_EMAIL_SENT, $admin?->id, $request->ip());

        return response()->json([
            'ok'      => true,
            'message' => 'Rider created. Activation email sent to ' . $rider->work_email,
            'rider'   => $rider,
        ], 201);
    }

    /**
     * PUT /api/admin/riders/{rider}
     */
    public function update(Request $request, Rider $rider): JsonResponse
    {
        $data = $request->validate([
            'name'                => ['sometimes', 'string', 'max:255'],
            'work_email'          => ['sometimes', 'email', 'max:255', Rule::unique('riders', 'work_email')->ignore($rider->id)],
            'phone'               => ['nullable', 'string', 'max:30'],
            'zone'                => ['nullable', 'string', 'max:100'],
            'zone_id'             => ['nullable', 'integer', 'exists:zones,id'],
            'employment_type'     => ['nullable', 'string', 'max:50'],
            'warehouse'           => ['nullable', 'string', 'max:255'],
            'vehicle_type'        => ['nullable', 'string', 'max:50'],
            'vehicle_plate'       => ['nullable', 'string', 'max:20'],
            'max_parcel_capacity' => ['nullable', 'integer', 'min:1', 'max:9999'],
            'shift_start'         => ['nullable', 'date_format:H:i'],
            'shift_end'           => ['nullable', 'date_format:H:i'],
            'status'              => ['sometimes', 'string', Rule::in(Rider::STATUSES)],
            'is_active'           => ['nullable', 'boolean'],
        ]);

        $admin  = $request->user();
        $oldStatus = $rider->status;

        // Sync is_active with status
        if (isset($data['status'])) {
            $data['is_active'] = $data['status'] === Rider::STATUS_ACTIVE;
        }

        $rider->update($data);

        // Audit: updated
        RiderAuditLog::log($rider, RiderAuditLog::ACTION_UPDATED, $admin?->id, $request->ip(), [
            'changes' => $data,
        ]);

        // Audit: status changed
        if (isset($data['status']) && $data['status'] !== $oldStatus) {
            RiderAuditLog::log($rider, RiderAuditLog::ACTION_STATUS_CHANGED, $admin?->id, $request->ip(), [
                'from' => $oldStatus,
                'to'   => $data['status'],
            ]);
        }

        return response()->json(['ok' => true, 'rider' => $rider->fresh()]);
    }

    /**
     * POST /api/admin/riders/{rider}/resend-setup-email
     * Regenerate token and resend activation email.
     */
    public function resendSetupEmail(Request $request, Rider $rider): JsonResponse
    {
        if (! $rider->work_email) {
            return response()->json([
                'message' => 'Rider has no work email configured.',
            ], 422);
        }

        $admin = $request->user();

        // Reset rider to pending if needed
        if ($rider->status === Rider::STATUS_ACTIVE && ! $rider->must_change_password) {
            // Already activated — still allow resend but don't change status
        } else {
            $rider->update([
                'status'              => Rider::STATUS_PENDING,
                'must_change_password' => true,
                'is_active'           => false,
            ]);
        }

        $rawToken = RiderPasswordSetup::generateFor($rider);
        $this->sendSetupEmail($rider, $rawToken);

        RiderAuditLog::log($rider, RiderAuditLog::ACTION_SETUP_EMAIL_SENT, $admin?->id, $request->ip());

        return response()->json([
            'ok'      => true,
            'message' => 'Setup email resent to ' . $rider->work_email,
        ]);
    }

    /**
     * DELETE /api/admin/riders/{rider}
     */
    public function destroy(Rider $rider): JsonResponse
    {
        $rider->delete();
        return response()->json(['ok' => true]);
    }

    /* ── Private helpers ───────────────────────────────────────── */

    private function sendSetupEmail(Rider $rider, string $rawToken): void
    {
        $mail = new RiderSetupPasswordMail($rider, $rawToken);

        // Use queue if configured, otherwise send synchronously
        if (config('queue.default') !== 'sync') {
            Mail::to($rider->work_email)->queue($mail);
        } else {
            Mail::to($rider->work_email)->send($mail);
        }
    }
}
