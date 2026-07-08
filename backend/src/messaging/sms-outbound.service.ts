import { Injectable, Logger } from '@nestjs/common';
import { normalizeWhatsAppPhone } from './whatsapp-phone.util';

export type SmsSendResult = {
  sent: boolean;
  skippedReason?: string;
  messageId?: string;
};

@Injectable()
export class SmsOutboundService {
  private readonly logger = new Logger(SmsOutboundService.name);

  isEnabled(): boolean {
    return process.env.SMS_ENABLED === 'true';
  }

  async send(params: { phone: string; body: string }): Promise<SmsSendResult> {
    const to = normalizeWhatsAppPhone(params.phone);
    if (!to) {
      return { sent: false, skippedReason: 'invalid_phone' };
    }

    if (!this.isEnabled()) {
      this.logger.debug(`SMS (log only) → ${to}: ${params.body.slice(0, 160)}`);
      return { sent: false, skippedReason: 'sms_disabled' };
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_FROM_NUMBER?.trim();
    if (!accountSid || !authToken || !from) {
      this.logger.warn('SMS_ENABLED but Twilio credentials missing');
      return { sent: false, skippedReason: 'credentials_missing' };
    }

    const body = new URLSearchParams({
      To: to,
      From: from,
      Body: params.body,
    });

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      );

      const json = (await res.json()) as { sid?: string; message?: string };
      if (!res.ok) {
        this.logger.warn(
          `SMS send failed (${res.status}): ${json.message ?? res.statusText}`,
        );
        return { sent: false, skippedReason: 'provider_error' };
      }

      return { sent: true, messageId: json.sid };
    } catch (err) {
      this.logger.warn(`SMS send error: ${String(err)}`);
      return { sent: false, skippedReason: 'network_error' };
    }
  }
}
