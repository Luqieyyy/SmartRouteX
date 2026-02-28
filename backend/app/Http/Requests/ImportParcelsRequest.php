<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportParcelsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'file' => ['required','file','mimes:csv,txt','max:10240'], // 10MB
            'default_priority' => ['nullable','in:NORMAL,EXPRESS'],
            'default_zone' => ['nullable','string','max:100'],
        ];
    }
}