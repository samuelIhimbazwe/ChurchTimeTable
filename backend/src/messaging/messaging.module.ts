import { Global, Module } from '@nestjs/common';
import { AppLinkService } from './app-link.service';
import { WhatsAppOutboundService } from './whatsapp-outbound.service';
import { IndividualWhatsAppService } from './individual-whatsapp.service';
import { EmailOutboundService } from './email-outbound.service';
import { SmsOutboundService } from './sms-outbound.service';
import { OnboardingDeliveryService } from './onboarding-delivery.service';

@Global()
@Module({
  providers: [
    AppLinkService,
    WhatsAppOutboundService,
    IndividualWhatsAppService,
    EmailOutboundService,
    SmsOutboundService,
    OnboardingDeliveryService,
  ],
  exports: [
    AppLinkService,
    WhatsAppOutboundService,
    IndividualWhatsAppService,
    EmailOutboundService,
    SmsOutboundService,
    OnboardingDeliveryService,
  ],
})
export class MessagingModule {}
