import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireAnyPermissions } from '../common/decorators/roles.decorator';
import { ADMIN_SETTINGS_ACCESS, PERMISSIONS } from '../common/constants/roles';
import { DataQualityService } from '../pilot-ready/data-quality.service';
import { PilotReadinessService } from '../pilot-ready/pilot-readiness.service';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard, PhoneOperationalGuard)
export class SystemController {
  constructor(
    private prisma: PrismaService,
    private dataQualityService: DataQualityService,
    private pilotReadinessService: PilotReadinessService,
  ) {}

  @Get('stats')
  @RequireAnyPermissions(...ADMIN_SETTINGS_ACCESS)
  async stats() {
    const started = Date.now();
    const [users, members, operationOccurrences, auditLogs, syncConflicts, activeChoirs] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.member.count(),
        this.prisma.operationOccurrence.count(),
        this.prisma.auditLog.count(),
        this.prisma.syncConflict.count(),
        this.prisma.choir.count({ where: { isActive: true } }),
      ]);

    const apiResponseMs = Date.now() - started;
    const systemHealth =
      syncConflicts > 10 ? 'attention' : syncConflicts > 0 ? 'warning' : 'healthy';

    return {
      users,
      members,
      operationOccurrences,
      auditLogs,
      syncConflicts,
      choirs: activeChoirs,
      activeChoirs,
      totalMembers: members,
      totalOccurrences: operationOccurrences,
      systemHealth,
      dbSize: 'managed',
      lastBackup: 'see deployment center',
      apiResponseMs,
    };
  }

  @Get('data-quality')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    ...ADMIN_SETTINGS_ACCESS,
  )
  getDataQuality(@CurrentUser('sub') userId: string) {
    return this.dataQualityService.metrics(userId);
  }

  @Get('pilot-readiness')
  @RequireAnyPermissions(
    PERMISSIONS.PILOT_READINESS_VIEW,
    PERMISSIONS.CHURCH_INTELLIGENCE_VIEW,
    ...ADMIN_SETTINGS_ACCESS,
  )
  getPilotReadiness(@CurrentUser('sub') userId: string) {
    return this.pilotReadinessService.indicators(userId);
  }
}
