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
            'hub_id'    => ['sometimes', 'integer', 'exists:hubs,id'],
            'name'      => ['required', 'string', 'max:255'],
            'code'      => [
                'required', 'string', 'max:20',
                Rule::unique('zones')->where(function ($query) use ($hubId) {
                    return $query->where('hub_id', $hubId);
                }),
            ],
            'is_active' => ['sometimes', 'boolean'],
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
