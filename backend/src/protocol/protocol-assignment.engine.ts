import { Injectable } from '@nestjs/common';
import {
  MemberStatus,
  ProtocolAssignmentMode,
  ProtocolTeamMemberType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceQuotaEngine } from './service-quota.engine';
import { PROTOCOL_TEAM_SIZING, PROTOCOL_UNIT_CODE } from './protocol.constants';
import {
  mapMembersToAllChoirIds,
  mapMembersToSingingChoirs,
  resolveSingingChoirIds,
} from './protocol-singing-choirs.util';

export type ProtocolMemberRecommendation = {
  memberId: string;
  displayName: string;
  assignmentType: ProtocolTeamMemberType;
  quotaStatus: 'AVAILABLE' | 'LOW_PRIORITY';
  officialServicesMonth: number;
  score: number;
  singingChoirId?: string;
  choirName?: string;
  totalServicesMonth?: number;
  attendanceRate?: number;
  reliabilityScore?: number;
  attendancePoints?: number;
};

const CHOIR_COMPOSED_MODES = new Set<ProtocolAssignmentMode>([
  'SUNDAY',
  'TUESDAY',
  'IGABURO',
]);

@Injectable()
export class ProtocolAssignmentEngine {
  constructor(
    private prisma: PrismaService,
    private quota: ServiceQuotaEngine,
  ) {}

  /** Members who already have 3 assignments this month (DB + in-flight batch). */
  async memberIdsBlockedByMonthlyCap(
    at: Date,
    batchCounts: Map<string, number> = new Map(),
  ): Promise<string[]> {
    const settings = await this.quota.getSettings();
    const max = settings.maxOfficialServicesPerMonth;
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { code: PROTOCOL_UNIT_CODE, isActive: true },
      select: {
        memberships: {
          where: { status: 'ACTIVE' },
          select: { memberId: true },
        },
      },
    });
    if (!unit) return [];

    const blocked: string[] = [];
    for (const row of unit.memberships) {
      const dbCount = await this.quota.countAssignmentsInMonth(row.memberId, at);
      const total = dbCount + (batchCounts.get(row.memberId) ?? 0);
      if (total >= max) blocked.push(row.memberId);
    }
    return blocked;
  }

  async recommend(params: {
    occurrenceId: string;
    mode: ProtocolAssignmentMode;
    teamSize?: number;
    nonChoirLimit?: number;
    excludeMemberIds?: string[];
    monthBatchCounts?: Map<string, number>;
  }): Promise<ProtocolMemberRecommendation[]> {
    const settings = await this.quota.getSettings();
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: params.occurrenceId },
      include: { template: true },
    });

    const protocolUnit = await this.prisma.operationalUnit.findFirst({
      where: { code: PROTOCOL_UNIT_CODE, isActive: true },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            member: {
              include: { protocolMemberProfile: true },
            },
          },
        },
      },
    });

    if (!protocolUnit) {
      return [];
    }

    const protocolMembers = protocolUnit.memberships
      .map((m) => m.member)
      .filter((m) => m.status === MemberStatus.ACTIVE);

    const memberIds = protocolMembers.map((m) => m.id);
    const singingChoirIds = await resolveSingingChoirIds(
      this.prisma,
      params.occurrenceId,
    );
    const choirNames = singingChoirIds.length
      ? new Map(
          (
            await this.prisma.choir.findMany({
              where: { id: { in: singingChoirIds } },
              select: { id: true, name: true },
            })
          ).map((c) => [c.id, c.name] as const),
        )
      : new Map<string, string>();

    const memberChoirMap = await mapMembersToSingingChoirs(
      this.prisma,
      memberIds,
      singingChoirIds,
    );
    const allChoirMap = await mapMembersToAllChoirIds(this.prisma, memberIds);

    const batchCounts = params.monthBatchCounts ?? new Map();
    const monthlyBlocked = new Set(
      await this.memberIdsBlockedByMonthlyCap(occurrence.startAt, batchCounts),
    );

    const scored: ProtocolMemberRecommendation[] = [];

    for (const member of protocolMembers) {
      const profile = member.protocolMemberProfile;
      const allMemberChoirs = allChoirMap.get(member.id) ?? [];
      const singingHere = memberChoirMap.get(member.id) ?? [];

      // Choir members may only serve the occurrence where their choir sings.
      if (allMemberChoirs.length > 0 && singingHere.length === 0) {
        continue;
      }

      const dbMonthCount = await this.quota.countAssignmentsInMonth(
        member.id,
        occurrence.startAt,
      );
      const monthTotal =
        dbMonthCount + (batchCounts.get(member.id) ?? 0);
      const atCap = monthTotal >= settings.maxOfficialServicesPerMonth;

      if (atCap || monthlyBlocked.has(member.id)) {
        continue;
      }

      const quota = await this.quota.quotaStatus(member.id, occurrence.startAt);
      const primaryChoirId = singingHere[0];
      let score = 100 - monthTotal * 25;

      if (params.mode === 'SUNDAY') {
        score += primaryChoirId ? 50 : 10;
      } else if (CHOIR_COMPOSED_MODES.has(params.mode)) {
        score += primaryChoirId ? 40 : 12;
      } else {
        score += primaryChoirId ? 5 : 15;
      }

      scored.push({
        memberId: member.id,
        displayName: `${member.firstName} ${member.lastName}`,
        assignmentType: 'OFFICIAL',
        quotaStatus:
          monthTotal >= settings.maxOfficialServicesPerMonth - 1
            ? 'LOW_PRIORITY'
            : 'AVAILABLE',
        officialServicesMonth: monthTotal,
        score,
        singingChoirId: primaryChoirId,
        choirName: primaryChoirId ? choirNames.get(primaryChoirId) : undefined,
        totalServicesMonth: profile?.totalServicesMonth ?? 0,
        attendanceRate: profile?.attendanceRate ?? 0,
        reliabilityScore: profile?.reliabilityScore ?? 100,
        attendancePoints: profile?.attendedCount ?? 0,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    const exclude = new Set([
      ...(params.excludeMemberIds ?? []),
      ...monthlyBlocked,
    ]);
    const pool = exclude.size
      ? scored.filter((row) => !exclude.has(row.memberId))
      : scored;

    const targetSize =
      params.teamSize ?? PROTOCOL_TEAM_SIZING.TEAM_SIZE_TARGET;
    const nonChoirLimit = params.nonChoirLimit ?? settings.maxNonChoirMembers;

    if (CHOIR_COMPOSED_MODES.has(params.mode)) {
      return this.composeChoirAwareTeam(
        pool,
        singingChoirIds,
        nonChoirLimit,
        targetSize,
      );
    }

    return pool.slice(0, targetSize);
  }

  /**
   * Build a team of exactly `targetSize` (default 10):
   * members from singing choirs first, then non-choir members up to cap.
   */
  private composeChoirAwareTeam(
    scored: ProtocolMemberRecommendation[],
    singingChoirIds: string[],
    nonChoirLimit: number,
    targetSize: number,
  ): ProtocolMemberRecommendation[] {
    const selected: ProtocolMemberRecommendation[] = [];
    const used = new Set<string>();

    const takeFrom = (pool: ProtocolMemberRecommendation[], max: number) => {
      const picks: ProtocolMemberRecommendation[] = [];
      for (const row of pool) {
        if (used.has(row.memberId)) continue;
        if (picks.length >= max) break;
        picks.push(row);
        used.add(row.memberId);
      }
      return picks;
    };

    const byChoir = new Map<string, ProtocolMemberRecommendation[]>();
    for (const choirId of singingChoirIds) {
      byChoir.set(
        choirId,
        scored.filter((s) => s.singingChoirId === choirId),
      );
    }
    const nonChoirPool = scored.filter((s) => !s.singingChoirId);
    const reservedNonChoir = Math.min(nonChoirLimit, targetSize);

    if (singingChoirIds.length === 1) {
      const choirCap = Math.min(
        PROTOCOL_TEAM_SIZING.ONE_SINGING_CHOIR_MAX,
        targetSize - reservedNonChoir,
      );
      selected.push(
        ...takeFrom(byChoir.get(singingChoirIds[0]) ?? [], choirCap),
      );
    } else if (singingChoirIds.length >= 2) {
      const perChoirCap = PROTOCOL_TEAM_SIZING.TWO_SINGING_CHOIRS_EACH_MAX;
      const choirBudget = targetSize - reservedNonChoir;
      let choirTaken = 0;
      for (const choirId of singingChoirIds.slice(0, 2)) {
        const remaining = choirBudget - choirTaken;
        if (remaining <= 0) break;
        const picks = takeFrom(
          byChoir.get(choirId) ?? [],
          Math.min(perChoirCap, remaining),
        );
        selected.push(...picks);
        choirTaken += picks.length;
      }
    }

    const nonChoirSlots = Math.min(
      reservedNonChoir,
      targetSize - selected.length,
    );
    selected.push(...takeFrom(nonChoirPool, nonChoirSlots));

    if (selected.length < targetSize) {
      selected.push(...takeFrom(scored, targetSize - selected.length));
    }

    return selected.slice(0, targetSize);
  }

  /** Low-participation mode for special events */
  async recommendLowParticipation(params: {
    occurrenceId: string;
    teamSize?: number;
    excludeMemberIds?: string[];
    monthBatchCounts?: Map<string, number>;
  }): Promise<ProtocolMemberRecommendation[]> {
    return this.recommend({
      occurrenceId: params.occurrenceId,
      mode: 'SPECIAL_EVENT',
      teamSize: params.teamSize,
      excludeMemberIds: params.excludeMemberIds,
      monthBatchCounts: params.monthBatchCounts,
    });
  }
}
