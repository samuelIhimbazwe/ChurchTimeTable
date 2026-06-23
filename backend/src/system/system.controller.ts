import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PhoneOperationalGuard } from '../common/guards/phone-operational.guard';
import { UiCapabilityGuard } from '../common/guards/ui-capability.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireUiCapability } from '../common/decorators/ui-capability.decorator';
import { DataQualityService } from '../pilot-ready/data-quality.service';
import { PilotReadinessService } from '../pilot-ready/pilot-readiness.service';

@Controller('system')
@UseGuards(JwtAuthGuard, UiCapabilityGuard, PhoneOperationalGuard)
export class SystemController {
  constructor(
    private prisma: PrismaService,
    private dataQualityService: DataQualityService,
    private pilotReadinessService: PilotReadinessService,
  ) {}

  @Get('stats')
  @RequireUiCapability('admin-settings-manage')
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
  @RequireUiCapability('admin-settings-manage')
  getDataQuality(@CurrentUser('sub') userId: string) {
    return this.dataQualityService.metrics(userId);
  }

  @Get('pilot-readiness')
  @RequireUiCapability('admin-settings-manage')
  getPilotReadiness(@CurrentUser('sub') userId: string) {
    return this.pilotReadinessService.indicators(userId);
  }
}
