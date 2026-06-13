import { Injectable, Logger } from '@nestjs/common';
import { normalizeWhatsAppPhone } from './whatsapp-phone.util';

export type WhatsAppSendResult = {
  sent: boolean;
  skippedReason?: string;
  messageId?: string;
};

export type WhatsAppSendParams = {
  phone: string;
  body: string;
  templateName?: string;
  templateLanguage?: string;
};

@Injectable()
export class WhatsAppOutboundService {
  private readonly logger = new Logger(WhatsAppOutboundService.name);

  isEnabled(): boolean {
    return process.env.WHATSAPP_ENABLED === 'true';
  }

  async send(params: WhatsAppSendParams): Promise<WhatsAppSendResult> {
    const to = normalizeWhatsAppPhone(params.phone);
    if (!to) {
      return { sent: false, skippedReason: 'invalid_phone' };
    }

    if (!this.isEnabled()) {
      this.logger.debug(
        `WhatsApp (log only) → ${to}: ${params.body.slice(0, 160)}`,
      );
      return { sent: false, skippedReason: 'whatsapp_disabled' };
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!token || !phoneNumberId) {
      this.logger.warn('WhatsApp enabled but credentials missing');
      return { sent: false, skippedReason: 'credentials_missing' };
    }

    const version = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    const payload = params.templateName
      ? this.buildTemplatePayload(to, params)
      : this.buildTextPayload(to, params.body);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as {
        messages?: Array<{ id?: string }>;
        error?: { message?: string };
      };

      if (!res.ok) {
        this.logger.warn(
          `WhatsApp send failed (${res.status}): ${json.error?.message ?? res.statusText}`,
        );
        return { sent: false, skippedReason: 'provider_error' };
      }

      return {
        sent: true,
        messageId: json.messages?.[0]?.id,
      };
    } catch (err) {
      this.logger.warn(`WhatsApp send error: ${String(err)}`);
      return { sent: false, skippedReason: 'network_error' };
    }
  }

  private buildTextPayload(to: string, body: string) {
    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body,
      },
    };
  }

  private buildTemplatePayload(to: string, params: WhatsAppSendParams) {
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.templateLanguage ?? 'en' },
      },
    };
  }
}
