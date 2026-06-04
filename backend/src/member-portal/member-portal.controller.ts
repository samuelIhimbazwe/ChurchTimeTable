import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MemberPortalDashboardService } from './member-portal-dashboard.service';

@Controller('member-portal')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class MemberPortalController {
  constructor(private dashboard: MemberPortalDashboardService) {}

  @Get('dashboard')
  portalDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboard.churchMemberDashboard(userId);
  }

  @Get('home')
  portalHome(@CurrentUser('sub') userId: string) {
    return this.dashboard.churchMemberDashboard(userId);
  }

  @Get('membership')
  membershipCenter(@CurrentUser('sub') userId: string) {
    return this.dashboard.membershipCenter(userId);
  }

  @Get('dashboard-context')
  dashboardContext(@CurrentUser('sub') userId: string) {
    return this.dashboard.dashboardContext(userId);
  }
}
