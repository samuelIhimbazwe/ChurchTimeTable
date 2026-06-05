import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirDiscoveryService } from '../member-portal/choir-discovery.service';
import {
  ChurchBrandingController,
  ChurchPublicController,
  UxAnalyticsController,
} from './auth-ux.controller';
import { ChurchWelcomeService } from './church-welcome.service';
import { ChurchBrandingService } from './church-branding.service';
import { UxAnalyticsService } from './ux-analytics.service';

@Module({
  imports: [AuthModule, MemberPhoneEnforcementModule],
  controllers: [
    ChurchPublicController,
    UxAnalyticsController,
    ChurchBrandingController,
  ],
  providers: [
    ChurchWelcomeService,
    ChurchBrandingService,
    UxAnalyticsService,
    ChoirDiscoveryService,
  ],
  exports: [ChurchBrandingService, UxAnalyticsService],
})
export class AuthUxModule {}
