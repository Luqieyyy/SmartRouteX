<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Password must contain at least 1 letter and 1 number, min 8 chars.
 */
class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strlen($value) < 8) {
            $fail('The :attribute must be at least 8 characters.');
            return;
        }

        if (! preg_match('/[A-Za-z]/', $value)) {
            $fail('The :attribute must contain at least one letter.');
            return;
        }

        if (! preg_match('/[0-9]/', $value)) {
            $fail('The :attribute must contain at least one number.');
        }
    }
}
