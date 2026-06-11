import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirDiscoveryService } from '../member-portal/choir-discovery.service';
import { ChoirMembershipRulesService } from '../member-portal/choir-membership-rules.service';
import {
  ChurchBrandingController,
  ChurchGivingController,
  ChurchPublicController,
  UxAnalyticsController,
} from './auth-ux.controller';
import { ChurchWelcomeService } from './church-welcome.service';
import { ChurchBrandingService } from './church-branding.service';
import { ChurchGivingService } from './church-giving.service';
import { UxAnalyticsService } from './ux-analytics.service';

@Module({
  imports: [AuthModule, MemberPhoneEnforcementModule],
  controllers: [
    ChurchPublicController,
    UxAnalyticsController,
    ChurchBrandingController,
    ChurchGivingController,
  ],
  providers: [
    ChurchWelcomeService,
    ChurchBrandingService,
    ChurchGivingService,
    UxAnalyticsService,
    ChoirMembershipRulesService,
    ChoirDiscoveryService,
  ],
  exports: [ChurchBrandingService, ChurchGivingService, UxAnalyticsService],
})
export class AuthUxModule {}
