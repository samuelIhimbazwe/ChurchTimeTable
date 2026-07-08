import { Injectable, Logger } from '@nestjs/common';

export type EmailSendResult = {
  sent: boolean;
  skippedReason?: string;
  messageId?: string;
};

@Injectable()
export class EmailOutboundService {
  private readonly logger = new Logger(EmailOutboundService.name);

  isEnabled(): boolean {
    return process.env.EMAIL_ENABLED === 'true';
  }

  async send(params: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<EmailSendResult> {
    const to = params.to.trim().toLowerCase();
    if (!to) {
      return { sent: false, skippedReason: 'invalid_email' };
    }

    if (!this.isEnabled()) {
      this.logger.log(
        `Email (log only) → ${to} | ${params.subject}\n${params.text}`,
      );
      return { sent: false, skippedReason: 'email_disabled' };
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      this.logger.warn('EMAIL_ENABLED but RESEND_API_KEY or EMAIL_FROM missing');
      return { sent: false, skippedReason: 'credentials_missing' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject: params.subject,
          text: params.text,
          html: params.html,
        }),
      });

      const json = (await res.json()) as { id?: string; message?: string };
      if (!res.ok) {
        this.logger.warn(
          `Email send failed (${res.status}): ${json.message ?? res.statusText}`,
        );
        return { sent: false, skippedReason: 'provider_error' };
      }

      return { sent: true, messageId: json.id };
    } catch (err) {
      this.logger.warn(`Email send error: ${String(err)}`);
      return { sent: false, skippedReason: 'network_error' };
    }
  }
}
