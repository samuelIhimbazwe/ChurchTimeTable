import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  ProtocolOccurrenceTeamStatus,
  ProtocolTeamMemberType,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import {
  PROTOCOL_AUDIT,
  PROTOCOL_AUDIT_ENTITY,
  PROTOCOL_UNIT_CODE,
  resolveAssignmentMode,
} from './protocol.constants';
import {
  hasProtocolManage,
  hasProtocolTeamApprove,
  hasProtocolTeamPublish,
  hasProtocolView,
} from './protocol-access.util';
import { ProtocolAssignmentEngine } from './protocol-assignment.engine';
import { ProtocolMembersService } from './protocol-members.service';
import { ProtocolTeamLeadersService } from './protocol-team-leaders.service';
import { ProtocolBackupsService } from './protocol-backups.service';
import { ProtocolNotificationsService } from './protocol-notifications.service';

@Injectable()
export class ProtocolTeamsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private assignmentEngine: ProtocolAssignmentEngine,
    private members: ProtocolMembersService,
    private teamLeaders: ProtocolTeamLeadersService,
    private backups: ProtocolBackupsService,
    private notifications: ProtocolNotificationsService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return { permissions: resolved.permissions };
  }

  async generateForOccurrence(
    actorUserId: string | null,
    occurrenceId: string,
    options?: { memberIds?: string[]; overrideReason?: string },
  ) {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { template: true, protocolTeam: true },
    });

    if (occurrence.protocolTeam) {
      return this.getTeamInternal(occurrence.protocolTeam.id);
    }

    const hasProtocolAssignment = await this.prisma.operationAssignment.findFirst({
      where: { occurrenceId, assignmentType: 'PROTOCOL_TEAM' },
    });
    if (!hasProtocolAssignment) {
      throw new BadRequestException('Occurrence has no protocol assignment slot');
    }

    const mode = resolveAssignmentMode(
      occurrence.template?.code,
      occurrence.type,
    );
    const recommendations =
      mode === 'SPECIAL_EVENT'
        ? await this.assignmentEngine.recommendLowParticipation({ occurrenceId })
        : await this.assignmentEngine.recommend({
            occurrenceId,
            mode,
          });

    const memberIds =
      options?.memberIds ??
      recommendations.map((r) => r.memberId);

    await this.members.ensureProfilesForMembers(memberIds);

    const team = await this.prisma.protocolOccurrenceTeam.create({
      data: {
        occurrenceId,
        assignmentMode: mode,
        generatedByUserId: actorUserId ?? undefined,
        members: {
          create: memberIds.map((memberId) => ({
            memberId,
            assignmentType: 'OFFICIAL' as ProtocolTeamMemberType,
            quotaOverrideReason: options?.overrideReason,
            quotaOverrideByUserId: options?.overrideReason
              ? actorUserId ?? undefined
              : undefined,
          })),
        },
      },
      include: {
        members: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        occurrence: { select: { id: true, title: true, startAt: true } },
      },
    });

    if (actorUserId) {
      await this.audit.log({
        userId: actorUserId,
        action: PROTOCOL_AUDIT.TEAM_GENERATED,
        entity: PROTOCOL_AUDIT_ENTITY,
        entityId: team.id,
        newValue: {
          occurrenceId,
          mode,
          memberCount: memberIds.length,
          overrideReason: options?.overrideReason,
        } as Prisma.InputJsonValue,
      });
    }

    await this.finalizeTeam(team.id, actorUserId);

    return this.getTeamInternal(team.id);
  }

  private async finalizeTeam(teamId: string, actorUserId: string | null) {
    const leaderRec = await this.teamLeaders.recommendForTeam(teamId);
    if (leaderRec.recommended && actorUserId) {
      await this.teamLeaders.assignToTeam(
        actorUserId,
        teamId,
        leaderRec.recommended.id,
      );
    } else if (leaderRec.recommended) {
      await this.prisma.protocolOccurrenceTeamLeader.create({
        data: {
          teamId,
          protocolTeamLeaderId: leaderRec.recommended.id,
        },
      });
    }
    await this.backups.persistForTeam(teamId);
    void this.notifications.notifyTeamAssigned(teamId);
  }

  private getTeamInternal(teamId: string) {
    return this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
      include: {
        members: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
            attendance: true,
          },
        },
        occurrence: { select: { id: true, title: true, startAt: true } },
        teamLeader: {
          include: {
            protocolTeamLeader: {
              include: {
                member: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        backups: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { rank: 'asc' },
        },
        report: true,
      },
    });
  }

  async assignTeamLeader(
    actorUserId: string,
    teamId: string,
    protocolTeamLeaderId: string,
    overrideReason?: string,
  ) {
    await this.actor(actorUserId);
    if (!hasProtocolManage((await this.permissions.resolveForUser(actorUserId)).permissions)) {
      throw new ForbiddenException('Coordinator only');
    }
    return this.teamLeaders.assignToTeam(
      actorUserId,
      teamId,
      protocolTeamLeaderId,
      overrideReason,
    );
  }

  async getBackups(actorUserId: string, teamId: string) {
    await this.actor(actorUserId);
    return this.backups.listForTeam(teamId);
  }

  async regenerateBackups(actorUserId: string, teamId: string) {
    await this.actor(actorUserId);
    return this.backups.persistForTeam(teamId);
  }

  async lowParticipationRecommendations(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    return this.assignmentEngine.recommendLowParticipation({ occurrenceId });
  }

  async onOccurrencePublished(occurrenceId: string, actorUserId: string) {
    const existing = await this.prisma.protocolOccurrenceTeam.findUnique({
      where: { occurrenceId },
    });
    if (existing) return this.getTeamInternal(existing.id);
    const team = await this.generateForOccurrence(actorUserId, occurrenceId);
    return team;
  }

  async transitionStatus(
    actorUserId: string,
    teamId: string,
    status: ProtocolOccurrenceTeamStatus,
  ) {
    const { permissions } = await this.actor(actorUserId);
    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
    });

    if (
      (status === 'REVIEWED' || status === 'APPROVED') &&
      !hasProtocolTeamApprove(permissions)
    ) {
      throw new ForbiddenException('Approval denied');
    }
    if (status === 'PUBLISHED' && !hasProtocolTeamPublish(permissions)) {
      throw new ForbiddenException('Publication denied');
    }
    if (status === 'COMPLETED' && !hasProtocolManage(permissions)) {
      throw new ForbiddenException('Completion denied');
    }

    const updated = await this.prisma.protocolOccurrenceTeam.update({
      where: { id: teamId },
      data: {
        status,
        reviewedAt: status === 'REVIEWED' ? new Date() : team.reviewedAt,
        approvedAt: status === 'APPROVED' ? new Date() : team.approvedAt,
        publishedAt: status === 'PUBLISHED' ? new Date() : team.publishedAt,
        completedAt: status === 'COMPLETED' ? new Date() : team.completedAt,
        approvedByUserId:
          status === 'APPROVED' || status === 'PUBLISHED'
            ? actorUserId
            : team.approvedByUserId,
      },
      include: {
        members: {
          include: {
            member: { select: { id: true, firstName: true, lastName: true } },
            attendance: true,
          },
        },
        occurrence: true,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_STATUS,
      entity: PROTOCOL_AUDIT_ENTITY,
      entityId: teamId,
      newValue: { status } as Prisma.InputJsonValue,
    });

    return updated;
  }

  async listTeams(actorUserId: string, from?: Date, to?: Date) {
    await this.actor(actorUserId);
    return this.prisma.protocolOccurrenceTeam.findMany({
      where: {
        occurrence: {
          ...(from || to
            ? {
                startAt: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
      },
      include: {
        occurrence: {
          select: { id: true, title: true, startAt: true, status: true },
        },
        members: { select: { id: true } },
      },
      orderBy: { generatedAt: 'desc' },
      take: 100,
    });
  }

  async getTeam(actorUserId: string, teamId: string) {
    await this.actor(actorUserId);
    return this.getTeamInternal(teamId);
  }

  async recommendations(actorUserId: string, occurrenceId: string) {
    await this.actor(actorUserId);
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { template: true },
    });
    const mode = resolveAssignmentMode(
      occurrence.template?.code,
      occurrence.type,
    );
    return this.assignmentEngine.recommend({ occurrenceId, mode });
  }

  async getProtocolUnitId() {
    const unit = await this.prisma.operationalUnit.findFirstOrThrow({
      where: { code: PROTOCOL_UNIT_CODE, isActive: true },
    });
    return unit.id;
  }
}
