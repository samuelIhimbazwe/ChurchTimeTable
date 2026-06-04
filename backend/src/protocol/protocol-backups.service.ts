import { Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceQuotaEngine } from './service-quota.engine';
import { PROTOCOL_UNIT_CODE } from './protocol.constants';

export type BackupRecommendation = {
  memberId: string;
  displayName: string;
  rank: number;
  officialServicesMonth: number;
};

@Injectable()
export class ProtocolBackupsService {
  constructor(
    private prisma: PrismaService,
    private quota: ServiceQuotaEngine,
  ) {}

  async recommendForTeam(teamId: string): Promise<BackupRecommendation[]> {
    const settings = await this.quota.getSettings();
    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
      include: {
        members: { select: { memberId: true } },
        occurrence: true,
      },
    });

    const assignedIds = new Set(team.members.map((m) => m.memberId));
    const protocolUnit = await this.prisma.operationalUnit.findFirst({
      where: { code: PROTOCOL_UNIT_CODE, isActive: true },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: { member: true },
        },
      },
    });

    if (!protocolUnit) return [];

    const candidates = protocolUnit.memberships
      .map((m) => m.member)
      .filter(
        (m) =>
          m.status === MemberStatus.ACTIVE && !assignedIds.has(m.id),
      );

    const scored: BackupRecommendation[] = [];
    for (const member of candidates) {
      const quota = await this.quota.quotaStatus(
        member.id,
        team.occurrence.startAt,
      );
      scored.push({
        memberId: member.id,
        displayName: `${member.firstName} ${member.lastName}`,
        rank: 0,
        officialServicesMonth: quota.officialCount,
      });
    }

    scored.sort((a, b) => a.officialServicesMonth - b.officialServicesMonth);
    return scored
      .slice(0, settings.backupPoolSize)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }

  async persistForTeam(teamId: string) {
    const recommendations = await this.recommendForTeam(teamId);
    await this.prisma.protocolOccurrenceTeamBackup.deleteMany({
      where: { teamId },
    });
    if (recommendations.length === 0) return [];

    await this.prisma.protocolOccurrenceTeamBackup.createMany({
      data: recommendations.map((r) => ({
        teamId,
        memberId: r.memberId,
        rank: r.rank,
      })),
    });

    return this.listForTeam(teamId);
  }

  async listForTeam(teamId: string) {
    return this.prisma.protocolOccurrenceTeamBackup.findMany({
      where: { teamId },
      orderBy: { rank: 'asc' },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}
