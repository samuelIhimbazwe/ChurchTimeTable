import { Injectable, Logger } from '@nestjs/common';

export type ContributionSmsPayload = {
  phone: string;
  memberName: string;
  amount: number;
  currency: string;
  referenceNumber: string;
  contributionId: string;
};

export type ContributionSmsResult = {
  sent: boolean;
  skippedReason?: string;
};

/**
 * SMS-ready channel — provider integration deferred; in-app thank-you always primary.
 * Enable with SMS_ENABLED=true when a provider is wired.
 */
@Injectable()
export class ContributionSmsChannel {
  private readonly logger = new Logger(ContributionSmsChannel.name);

  isEnabled(): boolean {
    return process.env.SMS_ENABLED === 'true';
  }

  async sendThankYou(
    payload: ContributionSmsPayload,
  ): Promise<ContributionSmsResult> {
    if (!this.isEnabled()) {
      return { sent: false, skippedReason: 'sms_disabled' };
    }

    this.logger.debug(
      `SMS thank-you skipped (no provider): ${payload.referenceNumber}`,
    );
    return { sent: false, skippedReason: 'provider_not_configured' };
  }
}
