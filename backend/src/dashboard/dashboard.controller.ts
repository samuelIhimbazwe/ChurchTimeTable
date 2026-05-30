import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RequireAnyPermissions, RequirePermissions } from '../common/decorators/roles.decorator';
import { PERMISSIONS } from '../common/constants/roles';
import { SuperAdminOnly } from '../common/decorators/super-admin.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { assertOperationalMemberAccess } from '../common/member/member-access.util';
import {
  hasChoirOperations,
  hasProtocolCoordination,
  hasProtocolOversight,
  hasProtocolTeamHeadAuthority,
} from '../common/governance/governance-permissions.util';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, SuperAdminGuard, RolesGuard)
export class DashboardController {
  constructor(
    private dashboard: DashboardService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  @Get('leader-summary')
  @RequireAnyPermissions(
    PERMISSIONS.PROTOCOL_OVERSIGHT_SCOPE,
    PERMISSIONS.PROTOCOL_TEAM_MANAGE_SCOPE,
    PERMISSIONS.PROTOCOL_OPERATIONAL_MONITOR,
    PERMISSIONS.CHOIR_OVERSIGHT,
    PERMISSIONS.CHOIR_OPERATIONS_MANAGE,
    PERMISSIONS.REPORT_EXPORT,
  )
  async leaderSummary(@CurrentUser() user: JwtPayload) {
    await assertOperationalMemberAccess(this.prisma, user.sub);
    const data = await this.dashboard.leaderSummary(user.sub, user.permissions ?? []);
    await this.audit.log({
      userId: user.sub,
      action: 'dashboard.leader_summary.view',
      entity: 'Dashboard',
    });
    return data;
  }

  @Get('member-summary')
  async memberSummary(@CurrentUser() user: JwtPayload) {
    await assertOperationalMemberAccess(this.prisma, user.sub);
    const member = await this.prisma.member.findFirst({
      where: { userId: user.sub },
    });
    if (!member) throw new NotFoundException('Member profile not found');
    return this.dashboard.memberSummary(user.sub, member.id, user.permissions ?? []);
  }

  @Get('admin-summary')
  @SuperAdminOnly()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async adminSummary(@CurrentUser() user: JwtPayload) {
    await assertOperationalMemberAccess(this.prisma, user.sub);
    const data = await this.dashboard.adminSummary(user.sub, user.permissions ?? []);
    await this.audit.log({
      userId: user.sub,
      action: 'dashboard.admin_summary.view',
      entity: 'Dashboard',
    });
    return data;
  }

  @Get('intelligence')
  @RequirePermissions(PERMISSIONS.REPORT_EXPORT)
  async intelligenceSummary(@CurrentUser() user: JwtPayload) {
    await assertOperationalMemberAccess(this.prisma, user.sub);
    const data = await this.dashboard.intelligenceSummary(
      user.permissions ?? [],
      user.sub,
    );
    await this.audit.log({
      userId: user.sub,
      action: 'dashboard.intelligence.view',
      entity: 'Dashboard',
    });
    return data;
  }

  @Get('operational/:role')
  async operationalRoleSummary(
    @Param('role') role: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const validRoles = ['team-head', 'coordinator', 'president', 'choir-leader'] as const;
    if (!validRoles.includes(role as (typeof validRoles)[number])) {
      throw new NotFoundException('Unknown operational role dashboard');
    }

    const perms = user.permissions ?? [];
    const roleAllowed: Record<(typeof validRoles)[number], boolean> = {
      'team-head': hasProtocolTeamHeadAuthority(perms),
      coordinator: hasProtocolCoordination(perms),
      president: hasProtocolOversight(perms),
      'choir-leader': hasChoirOperations(perms),
    };

    if (!roleAllowed[role as (typeof validRoles)[number]]) {
      throw new NotFoundException('Insufficient permissions for this operational dashboard');
    }

    await assertOperationalMemberAccess(this.prisma, user.sub);

    const data = await this.dashboard.operationalRoleSummary(
      role as (typeof validRoles)[number],
      user.sub,
    );

    await this.audit.log({
      userId: user.sub,
      action: `dashboard.operational.${role}.view`,
      entity: 'Dashboard',
    });

    return data;
  }
}
