import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberMinistryScopeService } from './member-ministry-scope.service';
import { ProtocolMembershipService } from './protocol-membership.service';

export type ParticipationScheduleItem = {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  ministry: 'CHOIR' | 'PROTOCOL';
  kind: string;
  subtitle?: string | null;
};

export type ParticipationScheduleConflict = {
  date: string;
  choirTitle: string;
  protocolTitle: string;
};

export type ParticipationScheduleSummary = {
  ministryScope: string;
  isDualMember: boolean;
  hasChoirMembership: boolean;
  hasProtocolMembership: boolean;
  thisWeek: ParticipationScheduleItem[];
  conflicts: ParticipationScheduleConflict[];
};

@Injectable()
export class MemberPortalParticipationScheduleService {
  constructor(
    private prisma: PrismaService,
    private ministryScope: MemberMinistryScopeService,
    private protocolMembership: ProtocolMembershipService,
  ) {}

  async buildForUser(
    userId: string,
    options?: { withinDays?: number; from?: Date; to?: Date },
  ): Promise<ParticipationScheduleSummary> {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId },
    });
    const now = new Date();
    const rangeStart = options?.from ?? now;
    const rangeEnd =
      options?.to ??
      (() => {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + (options?.withinDays ?? 7));
        return weekEnd;
      })();

    const [hasChoir, hasProtocol, choirItems, protocolItems] = await Promise.all([
      this.ministryScope.hasActiveChoirMembership(member.id),
      this.protocolMembership.isProtocolMember(member.id),
      this.loadChoirItems(userId, rangeStart, rangeEnd),
      this.loadProtocolItems(member.id, rangeStart, rangeEnd),
    ]);

    const thisWeek = [...choirItems, ...protocolItems].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

    return {
      ministryScope: member.ministry,
      isDualMember: hasChoir && hasProtocol,
      hasChoirMembership: hasChoir,
      hasProtocolMembership: hasProtocol,
      thisWeek,
      conflicts: this.detectConflicts(choirItems, protocolItems),
    };
  }

  private async loadChoirItems(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<ParticipationScheduleItem[]> {
    const memberships = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      select: { choirId: true, choir: { select: { name: true } } },
    });
    if (!memberships.length) return [];

    const choirIds = memberships.map((m) => m.choirId);
    const choirNameById = new Map(memberships.map((m) => [m.choirId, m.choir.name]));

    const activities = await this.prisma.choirActivity.findMany({
      where: {
        choirId: { in: choirIds },
        startAt: { gte: from, lte: to },
        activityType: { in: ['SERVICE', 'REHEARSAL', 'SPECIAL_REHEARSAL', 'PRAYER'] },
      },
      orderBy: { startAt: 'asc' },
      take: 120,
    });

    return activities.map((a) => ({
      id: `choir-${a.id}`,
      title: a.title,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt?.toISOString() ?? null,
      ministry: 'CHOIR' as const,
      kind: a.activityType,
      subtitle: choirNameById.get(a.choirId) ?? null,
    }));
  }

  private async loadProtocolItems(
    memberId: string,
    from: Date,
    to: Date,
  ): Promise<ParticipationScheduleItem[]> {
    const isMember = await this.protocolMembership.isProtocolMember(memberId);
    if (!isMember) return [];

    const rows = await this.prisma.protocolOccurrenceTeamMember.findMany({
      where: {
        memberId,
        team: {
          status: 'PUBLISHED',
          occurrence: { startAt: { gte: from, lte: to } },
        },
      },
      include: {
        team: {
          include: {
            occurrence: {
              select: { id: true, title: true, startAt: true, endAt: true },
            },
          },
        },
      },
      orderBy: { team: { occurrence: { startAt: 'asc' } } },
      take: 80,
    });

    return rows.map((row) => {
      const occ = row.team.occurrence;
      return {
        id: `protocol-${row.id}`,
        title: occ.title,
        startAt: occ.startAt.toISOString(),
        endAt: occ.endAt?.toISOString() ?? null,
        ministry: 'PROTOCOL' as const,
        kind: 'PROTOCOL_DUTY',
        subtitle: row.assignmentType === 'OFFICIAL' ? 'Official service' : String(row.assignmentType),
      };
    });
  }

  private detectConflicts(
    choirItems: ParticipationScheduleItem[],
    protocolItems: ParticipationScheduleItem[],
  ): ParticipationScheduleConflict[] {
    const choirServices = choirItems.filter((i) => i.kind === 'SERVICE');
    const conflicts: ParticipationScheduleConflict[] = [];

    for (const protocol of protocolItems) {
      const pDate = protocol.startAt.slice(0, 10);
      for (const choir of choirServices) {
        if (choir.startAt.slice(0, 10) !== pDate) continue;
        conflicts.push({
          date: pDate,
          choirTitle: choir.title,
          protocolTitle: protocol.title,
        });
        break;
      }
    }

    return conflicts;
  }
}
