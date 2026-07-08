import { Injectable } from '@nestjs/common';
import { EmailOutboundService } from './email-outbound.service';
import { SmsOutboundService } from './sms-outbound.service';
import { WhatsAppOutboundService } from './whatsapp-outbound.service';

export type ChannelDelivery = {
  email: string;
  sms: string;
  whatsapp: string;
};

@Injectable()
export class OnboardingDeliveryService {
  constructor(
    private email: EmailOutboundService,
    private sms: SmsOutboundService,
    private whatsapp: WhatsAppOutboundService,
  ) {}

  async deliverInvite(params: {
    email: string;
    phone?: string | null;
    subject: string;
    body: string;
  }): Promise<ChannelDelivery> {
    const [emailResult, whatsappResult, smsResult] = await Promise.all([
      this.email.send({
        to: params.email,
        subject: params.subject,
        text: params.body,
      }),
      params.phone
        ? this.whatsapp.send({ phone: params.phone, body: params.body })
        : Promise.resolve({ sent: false, skippedReason: 'no_phone' }),
      params.phone
        ? this.sms.send({ phone: params.phone, body: params.body })
        : Promise.resolve({ sent: false, skippedReason: 'no_phone' }),
    ]);

    return {
      email: emailResult.sent ? 'sent' : (emailResult.skippedReason ?? 'skipped'),
      whatsapp: whatsappResult.sent
        ? 'sent'
        : (whatsappResult.skippedReason ?? 'skipped'),
      sms: smsResult.sent ? 'sent' : (smsResult.skippedReason ?? 'skipped'),
    };
  }

  async deliverCredentials(params: {
    email: string;
    phone?: string | null;
    firstName: string;
    temporaryPassword: string;
    loginUrl: string;
  }): Promise<ChannelDelivery> {
    const greeting = params.firstName.trim() || 'there';
    const body = [
      `Hello ${greeting},`,
      '',
      'Your Church CMMS account has been created.',
      `Email: ${params.email}`,
      `Temporary password: ${params.temporaryPassword}`,
      '',
      `Sign in and change your password: ${params.loginUrl}`,
      '',
      'If you did not expect this message, contact your ministry administrator.',
    ].join('\n');

    return this.deliverInvite({
      email: params.email,
      phone: params.phone,
      subject: 'Your Church CMMS login credentials',
      body,
    });
  }
}
