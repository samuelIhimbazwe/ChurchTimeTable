import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PROTOCOL_AUDIT } from './protocol.constants';
import {
  hasProtocolManage,
  hasProtocolTeamLeaderManage,
  hasProtocolView,
} from './protocol-access.util';

@Injectable()
export class ProtocolTeamLeadersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
  ) {}

  private async assertManage(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (
      !hasProtocolTeamLeaderManage(resolved.permissions) &&
      !hasProtocolManage(resolved.permissions)
    ) {
      throw new ForbiddenException('Denied');
    }
  }

  async list(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return this.prisma.protocolTeamLeader.findMany({
      where: { active: true },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        choir: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ isNonChoirLeader: 'asc' }, { label: 'asc' }],
    });
  }

  async get(actorUserId: string, id: string) {
    await this.assertManage(actorUserId);
    const leader = await this.prisma.protocolTeamLeader.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        choir: { select: { id: true, name: true, code: true } },
        teamAssignments: {
          include: {
            team: {
              include: {
                occurrence: { select: { title: true, startAt: true } },
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!leader) throw new NotFoundException('Team leader not found');
    return leader;
  }

  async create(
    actorUserId: string,
    data: {
      memberId: string;
      choirId?: string;
      label?: string;
      isNonChoirLeader?: boolean;
      notes?: string;
    },
  ) {
    await this.assertManage(actorUserId);
    if (data.isNonChoirLeader && data.choirId) {
      throw new BadRequestException('Non-choir leader cannot have choirId');
    }
    const leader = await this.prisma.protocolTeamLeader.create({
      data: {
        memberId: data.memberId,
        choirId: data.isNonChoirLeader ? null : data.choirId,
        label: data.label,
        isNonChoirLeader: data.isNonChoirLeader ?? false,
        notes: data.notes,
      },
      include: {
        member: { select: { firstName: true, lastName: true } },
        choir: { select: { name: true } },
      },
    });
    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_LEADER_CREATED,
      entity: 'ProtocolTeamLeader',
      entityId: leader.id,
      newValue: data as Prisma.InputJsonValue,
    });
    return leader;
  }

  async update(
    actorUserId: string,
    id: string,
    data: {
      active?: boolean;
      label?: string;
      notes?: string;
      choirId?: string | null;
    },
  ) {
    await this.assertManage(actorUserId);
    const updated = await this.prisma.protocolTeamLeader.update({
      where: { id },
      data,
    });
    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_LEADER_UPDATED,
      entity: 'ProtocolTeamLeader',
      entityId: id,
      newValue: data as Prisma.InputJsonValue,
    });
    return updated;
  }

  /** Recommend team leader for an occurrence team based on singing choir */
  async recommendForTeam(teamId: string) {
    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
      include: {
        occurrence: {
          include: {
            assignments: {
              where: { assignmentType: 'MAIN_CHOIR' },
              include: { operationalUnit: true },
            },
          },
        },
      },
    });

    const nonChoirLeader = await this.prisma.protocolTeamLeader.findFirst({
      where: { active: true, isNonChoirLeader: true },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const mainAssignment = team.occurrence.assignments[0];
    if (!mainAssignment) {
      return { recommended: nonChoirLeader, reason: 'NO_MAIN_CHOIR' };
    }

    const choirLeaders = await this.prisma.protocolTeamLeader.findMany({
      where: { active: true, isNonChoirLeader: false, choirId: { not: null } },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        choir: { select: { id: true, name: true, code: true } },
      },
    });

    if (choirLeaders.length === 0) {
      return { recommended: nonChoirLeader, reason: 'FALLBACK_NON_CHOIR' };
    }

    return {
      recommended: choirLeaders[0],
      alternatives: choirLeaders.slice(1),
      nonChoirOption: nonChoirLeader,
      reason: 'MAIN_CHOIR_MATCH',
    };
  }

  async assignToTeam(
    actorUserId: string,
    teamId: string,
    protocolTeamLeaderId: string,
    overrideReason?: string,
  ) {
    await this.assertManage(actorUserId);
    const leader = await this.prisma.protocolTeamLeader.findUniqueOrThrow({
      where: { id: protocolTeamLeaderId },
    });
    if (!leader.active) {
      throw new BadRequestException('Team leader is inactive');
    }

    const assignment = await this.prisma.protocolOccurrenceTeamLeader.upsert({
      where: { teamId },
      create: {
        teamId,
        protocolTeamLeaderId,
        assignedByUserId: actorUserId,
        overrideReason,
      },
      update: {
        protocolTeamLeaderId,
        assignedByUserId: actorUserId,
        overrideReason,
      },
      include: {
        protocolTeamLeader: {
          include: {
            member: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_LEADER_ASSIGNED,
      entity: 'ProtocolOccurrenceTeamLeader',
      entityId: assignment.id,
      newValue: { teamId, protocolTeamLeaderId, overrideReason } as Prisma.InputJsonValue,
    });

    return assignment;
  }

  async myTeams(actorUserId: string) {
    const leader = await this.prisma.member.findUnique({
      where: { userId: actorUserId },
      include: { protocolTeamLeader: true },
    });
    if (!leader?.protocolTeamLeader) return [];

    return this.prisma.protocolOccurrenceTeam.findMany({
      where: {
        teamLeader: { protocolTeamLeaderId: leader.protocolTeamLeader.id },
      },
      include: {
        occurrence: { select: { title: true, startAt: true, status: true } },
        members: { select: { id: true } },
        report: true,
      },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
