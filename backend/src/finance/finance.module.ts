import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { I18nModule } from '../i18n/i18n.module';
import { AuditModule } from '../audit/audit.module';
import { GovernanceModule } from '../governance/governance.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinanceService } from './finance.service';
import { FinanceGovernanceService } from './finance-governance.service';
import { FinanceExportService } from './finance-export.service';
import { ContributionService } from './contribution.service';
import { ContributionScopeService } from './contribution-scope.service';
import { ContributionGovernanceService } from './contribution-governance.service';
import { ContributionEffectiveAmountService } from './contribution-effective-amount.service';
import { ContributionTotalsService } from './contribution-totals.service';
import { ContributionListService } from './contribution-list.service';
import { ContributionRankingsService } from './contribution-rankings.service';
import { ContributionCorrectionService } from './contribution-correction.service';
import { ContributionTimelineService } from './contribution-timeline.service';
import { ContributionSubmissionService } from './contribution-submission.service';
import { ContributionMemberService } from './contribution-member.service';
import { ContributionFamilyContextService } from './contribution-family-context.service';
import { ContributionFamilyDashboardService } from './contribution-family-dashboard.service';
import { ContributionAdjustmentsListService } from './contribution-adjustments-list.service';
import { ThankYouService } from './thank-you.service';
import { ContributionSmsChannel } from './contribution-sms.channel';
import { FinanceController } from './finance.controller';
import { ReceiptUploadService } from './receipt/receipt-upload.service';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ChoirHttpAccessModule } from '../common/choir/choir-http-access.module';
import { AuthUxModule } from '../auth-ux/auth-ux.module';
import { ContributionProtocolService } from './contribution-protocol.service';
import { ContributionWorkflowNotificationsService } from './contribution-workflow-notifications.service';
import { ContributionCatalogAdminService } from './contribution-catalog-admin.service';
import { ContributionActionTokenService } from './contribution-action-token.service';
import { ContributionQuickActionService } from './contribution-quick-action.service';

@Module({
  imports: [
    AuthModule,
    AuthUxModule,
    I18nModule,
    GovernanceModule,
    AuditModule,
    NotificationsModule,
    MemberPhoneEnforcementModule,
    ChoirHttpAccessModule,
  ],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    FinanceGovernanceService,
    FinanceExportService,
    ContributionService,
    ContributionScopeService,
    ContributionGovernanceService,
    ContributionEffectiveAmountService,
    ContributionTotalsService,
    ContributionListService,
    ContributionRankingsService,
    ContributionCorrectionService,
    ContributionTimelineService,
    ContributionSubmissionService,
    ContributionProtocolService,
    ContributionCatalogAdminService,
    ContributionMemberService,
    ContributionFamilyContextService,
    ContributionFamilyDashboardService,
    ContributionWorkflowNotificationsService,
    ContributionActionTokenService,
    ContributionQuickActionService,
    ContributionAdjustmentsListService,
    ThankYouService,
    ContributionSmsChannel,
    ReceiptUploadService,
  ],
  exports: [
    FinanceService,
    FinanceGovernanceService,
    FinanceExportService,
    ContributionService,
    ContributionScopeService,
    ContributionGovernanceService,
    ContributionEffectiveAmountService,
    ContributionTotalsService,
    ContributionListService,
    ContributionRankingsService,
    ContributionCorrectionService,
    ContributionTimelineService,
    ContributionSubmissionService,
    ContributionProtocolService,
    ContributionMemberService,
    ThankYouService,
    ContributionWorkflowNotificationsService,
    ContributionActionTokenService,
  ],
})
export class FinanceModule {}
