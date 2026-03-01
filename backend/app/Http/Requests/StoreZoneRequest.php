<?php

namespace App\Http\Requests;

use App\Models\Scopes\HubScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware + policy
    }

    public function rules(): array
    {
        $hubId = $this->resolveHubId();

        return [
            'hub_id'            => ['sometimes', 'integer', 'exists:hubs,id'],
            'name'              => ['required', 'string', 'max:255'],
            'code'              => [
                'required', 'string', 'max:20',
                Rule::unique('zones')->where(function ($query) use ($hubId) {
                    return $query->where('hub_id', $hubId);
                }),
            ],
            'is_active'         => ['sometimes', 'boolean'],
            'zone_boundary'     => ['nullable', 'array', 'min:3'],
            'zone_boundary.*.lat' => ['required_with:zone_boundary', 'numeric', 'between:-90,90'],
            'zone_boundary.*.lng' => ['required_with:zone_boundary', 'numeric', 'between:-180,180'],
            'color_code'        => ['sometimes', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    private function resolveHubId(): ?int
    {
        if ($this->has('hub_id')) {
            return (int) $this->input('hub_id');
        }

        return HubScope::resolveHubId();
    }
}
