import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChoirOpsAccessService } from './choir-ops-access.service';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';

@Injectable()
export class ChoirReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private opsAccess: ChoirOpsAccessService,
  ) {}

  private async assertReport(actorUserId: string, choirId?: string) {
    await this.opsAccess.requireReport(actorUserId, choirId);
  }

  async participationReport(actorUserId: string, choirId: string) {
    await this.assertReport(actorUserId, choirId);
    return this.prisma.choirMemberParticipationProfile.findMany({
      where: { choirId },
      include: {
        member: { select: { firstName: true, lastName: true } },
        badges: true,
      },
      orderBy: { overallParticipationScore: 'desc' },
    });
  }

  async attendanceByType(
    actorUserId: string,
    choirId: string,
    activityType: 'SERVICE' | 'REHEARSAL' | 'PRAYER',
  ) {
    await this.assertReport(actorUserId, choirId);
    const activities = await this.prisma.choirActivity.findMany({
      where: {
        choirId,
        activityType:
          activityType === 'REHEARSAL'
            ? { in: ['REHEARSAL', 'SPECIAL_REHEARSAL', 'TRAINING'] }
            : activityType,
      },
      include: {
        attendances: {
          include: {
            member: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { startAt: 'desc' },
      take: 50,
    });
    return activities;
  }

  async choirHealth(actorUserId: string, choirId: string) {
    await this.assertReport(actorUserId, choirId);
    const profiles = await this.prisma.choirMemberParticipationProfile.findMany({
      where: { choirId },
    });
    const avg =
      profiles.length > 0
        ? profiles.reduce((s, p) => s + p.overallParticipationScore, 0) /
          profiles.length
        : 0;
    const missing = profiles.filter((p) => p.unexcusedAbsences > 2).length;
    return {
      memberCount: profiles.length,
      averageParticipation: Math.round(avg * 10) / 10,
      membersAtRisk: missing,
      serviceRateAvg:
        profiles.length > 0
          ? profiles.reduce((s, p) => s + p.serviceAttendanceRate, 0) /
            profiles.length
          : 0,
    };
  }

  exportCsv(actorUserId: string, choirId: string, report: string): string {
    void this.assertReport(actorUserId, choirId);
    const header = 'memberId,overallScore,serviceRate,rehearsalRate,prayerRate\n';
    void choirId;
    void report;
    return header;
  }

  async logExport(actorUserId: string, choirId: string, format: string) {
    await this.assertReport(actorUserId, choirId);
    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.REPORT_EXPORTED,
      entity: 'ChoirReport',
      entityId: choirId,
      newValue: { format } as Prisma.InputJsonValue,
    });
  }
}
