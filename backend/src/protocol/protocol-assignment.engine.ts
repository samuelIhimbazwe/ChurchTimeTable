import { Injectable } from '@nestjs/common';
import {
  MemberStatus,
  ProtocolAssignmentMode,
  ProtocolTeamMemberType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceQuotaEngine } from './service-quota.engine';
import { PROTOCOL_UNIT_CODE } from './protocol.constants';

export type ProtocolMemberRecommendation = {
  memberId: string;
  displayName: string;
  assignmentType: ProtocolTeamMemberType;
  quotaStatus: 'AVAILABLE' | 'LOW_PRIORITY';
  officialServicesMonth: number;
  score: number;
  choirUnitCode?: string;
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
      include: {
        template: true,
        assignments: {
          include: {
            operationalUnit: {
              include: {
                memberships: {
                  where: { status: 'ACTIVE' },
                  include: { member: true },
                },
              },
            },
          },
        },
      },
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

    const mainChoirMemberIds = new Set<string>();
    for (const assignment of occurrence.assignments) {
      if (
        assignment.assignmentType === 'MAIN_CHOIR' &&
        assignment.operationalUnit.code === 'MAIN_CHOIR'
      ) {
        for (const m of assignment.operationalUnit.memberships) {
          if (m.member.status === MemberStatus.ACTIVE) {
            mainChoirMemberIds.add(m.memberId);
          }
        }
      }
    }

    const scored: ProtocolMemberRecommendation[] = [];

    for (const member of protocolMembers) {
      const quota = await this.quota.quotaStatus(member.id, occurrence.startAt);
      const inMainChoir = mainChoirMemberIds.has(member.id);
      let score = 100 - quota.officialCount * 20;

      if (params.mode === 'SUNDAY') {
        if (inMainChoir) {
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
        score += inMainChoir ? 5 : 15;
      }

      scored.push({
        memberId: member.id,
        displayName: `${member.firstName} ${member.lastName}`,
        assignmentType: 'OFFICIAL',
        quotaStatus: quota.status,
        officialServicesMonth: quota.officialCount,
        score,
        choirUnitCode: inMainChoir ? 'MAIN_CHOIR' : undefined,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    if (params.mode === 'SUNDAY') {
      const choir = scored.filter((s) => s.choirUnitCode === 'MAIN_CHOIR');
      const nonChoir = scored.filter((s) => !s.choirUnitCode);
      const limit = params.nonChoirLimit ?? settings.maxNonChoirMembers;
      return [...choir, ...nonChoir.slice(0, limit)];
    }

    const limit =
      params.teamSize ?? Math.max(6, Math.ceil(protocolMembers.length / 3));
    return scored.slice(0, limit);
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
    const limit = params.teamSize ?? Math.max(6, Math.ceil(scored.length / 3));
    return scored.slice(0, limit);
  }
}
