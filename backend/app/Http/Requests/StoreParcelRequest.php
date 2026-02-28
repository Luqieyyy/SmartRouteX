<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreParcelRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'barcode' => ['required','string','max:100','unique:parcels,barcode'],
            'tracking_no' => ['nullable','string','max:100'],
            'recipient_name' => ['nullable','string','max:255'],
            'recipient_phone' => ['nullable','string','max:30'],
            'raw_address' => ['nullable','string'],
            'zone' => ['nullable','string','max:100'],
            'priority' => ['nullable','in:NORMAL,EXPRESS'],
            'status' => ['nullable','in:CREATED,ASSIGNED,IN_TRANSIT,DELIVERED,FAILED'],
        ];
    }
}