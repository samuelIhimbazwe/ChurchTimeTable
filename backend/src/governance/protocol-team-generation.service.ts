import { Injectable } from '@nestjs/common';
import type { EventType, Member, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GenerateProtocolTeamsDto } from './dto/generate-protocol-teams.dto';

@Injectable()
export class ProtocolTeamGenerationService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async generate(dto: GenerateProtocolTeamsDto, actorUserId: string) {
    const candidates = await this.loadCandidates(dto.month, dto.year);
    if (!candidates.length) {
      return { createdTeams: 0, createdAssignments: 0, teams: [] };
    }

    const teamCount = dto.teamCount ?? Math.max(1, Math.ceil(candidates.length / 10));
    const sorted = [...candidates].sort((a, b) => a.loadScore - b.loadScore);
    const teamHeads = this.pickTeamHeads(sorted, teamCount, dto.preferredTeamHeadIds);

    const chunks = this.balanceMembersAcrossTeams(
      sorted.filter((member) => !teamHeads.find((head) => head.id === member.id)),
      teamCount,
    );

    const teams = [];
    let createdAssignments = 0;

    for (let i = 0; i < teamCount; i += 1) {
      const head = teamHeads[i] ?? chunks[i]?.[0];
      if (!head) continue;

      const members = [head, ...(chunks[i] ?? []).filter((m) => m.id !== head.id)];
      const compatibilityRate = this.compatibilityRate(members, dto.serviceType);

      const team = await this.prisma.protocolServiceTeam.create({
        data: {
          month: dto.month,
          year: dto.year,
          serviceType: dto.serviceType as EventType,
          teamHeadId: head.id,
          status: 'ACTIVE',
          createdBy: actorUserId,
          members: {
            create: members.map((member) => ({
              memberId: member.id,
              assignedByEngine: true,
              choirCompatible: this.isChoirCompatible(member, dto.serviceType),
              overrideReason: dto.overrideReason,
            })),
          },
        },
        include: {
          members: true,
          teamHead: true,
        },
      });

      teams.push({
        ...team,
        compatibilityRate,
      });
      createdAssignments += team.members.length;
    }

    await this.audit.log({
      userId: actorUserId,
      action: 'PROTOCOL_TEAM_GENERATION',
      entity: 'ProtocolServiceTeam',
      newValue: {
        month: dto.month,
        year: dto.year,
        serviceType: dto.serviceType,
        teamCount,
        createdTeams: teams.length,
        createdAssignments,
        overrideReason: dto.overrideReason,
      } as Prisma.InputJsonValue,
    });

    return { createdTeams: teams.length, createdAssignments, teams };
  }

  private async loadCandidates(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const members = await this.prisma.member.findMany({
      where: {
        status: 'ACTIVE',
        ministry: { in: ['PROTOCOL', 'BOTH'] },
      },
      include: {
        assignments: {
          where: {
            event: { startTime: { gte: start, lte: end } },
          },
          include: {
            event: true,
          },
        },
        attendances: {
          where: { createdAt: { gte: start } },
          take: 8,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return members
      .map((member) => ({
        ...member,
        loadScore: this.computeLoadScore(member),
      }))
      .filter((member) => this.countOfficialAssignments(member) < 3);
  }

  private computeLoadScore(
    member: Member & {
      assignments: Array<{ countsOfficialQuota: boolean | null }>;
      attendances: Array<{ physicalStatus: string }>;
    },
  ) {
    const officialAssignments = member.assignments.filter(
      (assignment) => assignment.countsOfficialQuota !== false,
    ).length;
    const missedRecent = member.attendances.filter(
      (attendance) => attendance.physicalStatus === 'ABSENT',
    ).length;
    return officialAssignments * 10 + missedRecent * 2;
  }

  private countOfficialAssignments(
    member: Member & {
      assignments: Array<{ countsOfficialQuota: boolean | null }>;
    },
  ) {
    return member.assignments.filter(
      (assignment) => assignment.countsOfficialQuota !== false,
    ).length;
  }

  private pickTeamHeads<T extends { id: string }>(
    candidates: T[],
    count: number,
    preferredIds?: string[],
  ) {
    const preferred = new Set(preferredIds ?? []);
    const preferredHeads = candidates.filter((candidate) => preferred.has(candidate.id));
    const remaining = candidates.filter((candidate) => !preferred.has(candidate.id));
    return [...preferredHeads, ...remaining].slice(0, count);
  }

  private balanceMembersAcrossTeams<T>(members: T[], teamCount: number) {
    const buckets = Array.from({ length: teamCount }, () => [] as T[]);
    members.forEach((member, index) => {
      buckets[index % teamCount].push(member);
    });
    return buckets;
  }

  private isChoirCompatible(
    member: Member & {
      assignments: Array<{ event: { type: EventType } }>;
    },
    serviceType: string,
  ) {
    if (member.ministry !== 'BOTH') {
      return false;
    }
    return member.assignments.some((assignment) => assignment.event.type === serviceType);
  }

  private compatibilityRate(
    members: Array<
      Member & {
        assignments: Array<{ event: { type: EventType } }>;
      }
    >,
    serviceType: string,
  ) {
    if (!members.length) return 0;
    const compatible = members.filter((member) =>
      this.isChoirCompatible(member, serviceType),
    ).length;
    return Math.round((compatible / members.length) * 100);
  }
}
