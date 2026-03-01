<?php

namespace App\Mail;

use App\Models\Rider;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RiderSetupPasswordMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public object $rider;
    public string $setupUrl;

    /**
     * @param  Rider   $rider
     * @param  string  $rawToken  The raw (un-hashed) one-time token
     */
    public function __construct(Rider $rider, string $rawToken)
    {
        // Don't serialize the full model - only store needed data
        // This avoids issues with global scopes during queue deserialization
        $this->rider = (object) [
            'name' => $rider->name,
            'work_email' => $rider->work_email,
        ];

        // Build URL pointing to the Next.js setup-password page
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:3000'), '/');
        $this->setupUrl = $frontendUrl . '/setup-password?token=' . $rawToken;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'SmartRouteX Rider Account Activation',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.rider-setup-password',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
