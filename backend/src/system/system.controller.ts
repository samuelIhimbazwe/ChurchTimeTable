import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../common/guards/super-admin.guard';
import { SuperAdminOnly } from '../common/decorators/super-admin.decorator';

@Controller('system')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@SuperAdminOnly()
export class SystemController {
  constructor(private prisma: PrismaService) {}

  @Get('stats')
  stats() {
    return this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.member.count(),
      this.prisma.event.count(),
      this.prisma.auditLog.count(),
      this.prisma.syncConflict.count(),
    ]).then(([users, members, events, auditLogs, syncConflicts]) => ({
      users,
      members,
      events,
      auditLogs,
      syncConflicts,
    }));
  }
}
