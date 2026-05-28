import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { SuperAdminOnly } from '../common/decorators/super-admin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private dashboard: DashboardService,
    private prisma: PrismaService,
  ) {}

  @Get('leader-summary')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  leaderSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboard.leaderSummary(user.sub, user.permissions ?? []);
  }

  @Get('member-summary')
  async memberSummary(@CurrentUser() user: JwtPayload) {
    const member = await this.prisma.member.findFirst({
      where: { userId: user.sub },
    });
    if (!member) throw new NotFoundException('Member profile not found');
    return this.dashboard.memberSummary(user.sub, member.id, user.permissions ?? []);
  }

  @Get('admin-summary')
  @SuperAdminOnly()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  adminSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboard.adminSummary(user.sub, user.permissions ?? []);
  }
}
