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
};

@Injectable()
export class ProtocolAssignmentEngine {
  constructor(
    private prisma: PrismaService,
    private quota: ServiceQuotaEngine,
  ) {}

  async recommend(params: {
    occurrenceId: string;
    mode: ProtocolAssignmentMode;
    teamSize?: number;
    nonChoirLimit?: number;
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
          include: { member: true },
        },
      },
    });

    if (!protocolUnit) {
      return [];
    }

    const protocolMembers = protocolUnit.memberships
      .map((m) => m.member)
      .filter((m) => m.status === MemberStatus.ACTIVE);

    const singingChoirIds = await resolveSingingChoirIds(
      this.prisma,
      params.occurrenceId,
    );
    const memberChoirMap = await mapMembersToSingingChoirs(
      this.prisma,
      protocolMembers.map((m) => m.id),
      singingChoirIds,
    );

    const scored: ProtocolMemberRecommendation[] = [];

    for (const member of protocolMembers) {
      const quota = await this.quota.quotaStatus(member.id, occurrence.startAt);
      const affiliated = memberChoirMap.get(member.id) ?? [];
      const primaryChoirId = affiliated[0];
      let score = 100 - quota.officialCount * 20;

      if (params.mode === 'SUNDAY') {
        if (primaryChoirId) {
          score += 50;
        } else {
          score += 10;
        }
        if (quota.status === 'LOW_PRIORITY') {
          score -= 40;
        }
      } else if (
        params.mode === 'TUESDAY' ||
        params.mode === 'IGABURO' ||
        params.mode === 'SPECIAL_EVENT'
      ) {
        if (quota.status === 'LOW_PRIORITY') {
          score -= 60;
        }
        score += primaryChoirId ? 5 : 15;
      }

      scored.push({
        memberId: member.id,
        displayName: `${member.firstName} ${member.lastName}`,
        assignmentType: 'OFFICIAL',
        quotaStatus: quota.status,
        officialServicesMonth: quota.officialCount,
        score,
        singingChoirId: primaryChoirId,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    if (params.mode === 'SUNDAY') {
      const nonChoirLimit = params.nonChoirLimit ?? settings.maxNonChoirMembers;
      return this.composeSundayTeam(scored, singingChoirIds, nonChoirLimit);
    }

    const limit =
      params.teamSize ?? Math.max(6, Math.ceil(protocolMembers.length / 3));
    return scored.slice(0, limit);
  }

  private composeSundayTeam(
    scored: ProtocolMemberRecommendation[],
    singingChoirIds: string[],
    nonChoirLimit: number,
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

    if (singingChoirIds.length === 1) {
      const choirId = singingChoirIds[0];
      selected.push(
        ...takeFrom(
          byChoir.get(choirId) ?? [],
          PROTOCOL_TEAM_SIZING.ONE_SINGING_CHOIR_MAX,
        ),
      );
      selected.push(...takeFrom(nonChoirPool, nonChoirLimit));
    } else if (singingChoirIds.length >= 2) {
      for (const choirId of singingChoirIds.slice(0, 2)) {
        selected.push(
          ...takeFrom(
            byChoir.get(choirId) ?? [],
            PROTOCOL_TEAM_SIZING.TWO_SINGING_CHOIRS_EACH_MAX,
          ),
        );
      }
      selected.push(...takeFrom(nonChoirPool, nonChoirLimit));
    } else {
      selected.push(...takeFrom(scored, PROTOCOL_TEAM_SIZING.TEAM_SIZE_MAX));
    }

    if (selected.length < PROTOCOL_TEAM_SIZING.TEAM_SIZE_MIN) {
      const filler = takeFrom(
        scored,
        PROTOCOL_TEAM_SIZING.TEAM_SIZE_MIN - selected.length,
      );
      selected.push(...filler);
    }

    return selected.slice(0, PROTOCOL_TEAM_SIZING.TEAM_SIZE_MAX);
  }

  /** Low-participation mode for special events and non-Sunday services */
  async recommendLowParticipation(params: {
    occurrenceId: string;
    teamSize?: number;
  }): Promise<ProtocolMemberRecommendation[]> {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: params.occurrenceId },
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

    if (!protocolUnit) return [];

    const scored: ProtocolMemberRecommendation[] = [];
    for (const m of protocolUnit.memberships) {
      if (m.member.status !== MemberStatus.ACTIVE) continue;
      const profile = m.member.protocolMemberProfile;
      const officialCount = profile?.officialServicesMonth ?? 0;
      const totalRecent = profile?.totalServicesMonth ?? 0;
      scored.push({
        memberId: m.member.id,
        displayName: `${m.member.firstName} ${m.member.lastName}`,
        assignmentType: 'OFFICIAL',
        quotaStatus: officialCount >= 3 ? 'LOW_PRIORITY' : 'AVAILABLE',
        officialServicesMonth: officialCount,
        score: 100 - totalRecent * 15 - officialCount * 10,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const limit =
      params.teamSize ??
      Math.min(
        PROTOCOL_TEAM_SIZING.TEAM_SIZE_MAX,
        Math.max(PROTOCOL_TEAM_SIZING.TEAM_SIZE_MIN, Math.ceil(scored.length / 3)),
      );
    return scored.slice(0, limit);
  }
}
