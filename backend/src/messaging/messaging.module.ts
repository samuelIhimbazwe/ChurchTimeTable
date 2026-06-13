import { Global, Module } from '@nestjs/common';
import { AppLinkService } from './app-link.service';
import { WhatsAppOutboundService } from './whatsapp-outbound.service';
import { IndividualWhatsAppService } from './individual-whatsapp.service';

@Global()
@Module({
  providers: [AppLinkService, WhatsAppOutboundService, IndividualWhatsAppService],
  exports: [AppLinkService, WhatsAppOutboundService, IndividualWhatsAppService],
})
export class MessagingModule {}
