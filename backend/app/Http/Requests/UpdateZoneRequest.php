<?php

namespace App\Http\Requests;

use App\Models\Scopes\HubScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware + policy
    }

    public function rules(): array
    {
        $zone = $this->route('zone');
        $hubId = $zone?->hub_id ?? HubScope::resolveHubId();

        return [
            'name'      => ['sometimes', 'string', 'max:255'],
            'code'      => [
                'sometimes', 'string', 'max:20',
                Rule::unique('zones')->where(function ($query) use ($hubId) {
                    return $query->where('hub_id', $hubId);
                })->ignore($zone?->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
