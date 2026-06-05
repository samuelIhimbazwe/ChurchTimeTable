import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PROTOCOL_AUDIT } from './protocol.constants';
import { ProtocolTeamLeaderAccessService } from './protocol-team-leader-access.service';
import { hasProtocolManage, hasProtocolReport } from './protocol-access.util';
import { PermissionsResolver } from '../auth/permissions.resolver';

@Injectable()
export class ProtocolTeamReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private leaderAccess: ProtocolTeamLeaderAccessService,
    private permissions: PermissionsResolver,
  ) {}

  async submit(
    actorUserId: string,
    teamId: string,
    data: {
      summary: string;
      issues?: string;
      recommendations?: string;
    },
  ) {
    const canManage = await this.leaderAccess.canManageTeam(actorUserId, teamId);
    if (!canManage) {
      throw new ForbiddenException('Only team leader or coordinator may submit');
    }

    const team = await this.prisma.protocolOccurrenceTeam.findUniqueOrThrow({
      where: { id: teamId },
      include: { teamLeaders: { orderBy: { assignedAt: 'asc' }, take: 1 } },
    });

    const primaryLeader = team.teamLeaders[0];
    if (!primaryLeader) {
      throw new BadRequestException('Team has no assigned leader');
    }

    const report = await this.prisma.protocolTeamReport.upsert({
      where: { teamId },
      create: {
        teamId,
        leaderId: primaryLeader.protocolTeamLeaderId,
        summary: data.summary,
        issues: data.issues,
        recommendations: data.recommendations,
        submittedByUserId: actorUserId,
      },
      update: {
        summary: data.summary,
        issues: data.issues,
        recommendations: data.recommendations,
        submittedAt: new Date(),
        submittedByUserId: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.TEAM_REPORT_SUBMITTED,
      entity: 'ProtocolTeamReport',
      entityId: report.id,
      newValue: data as Prisma.InputJsonValue,
    });

    return report;
  }

  async list(actorUserId: string, from?: Date, to?: Date) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasProtocolReport(resolved.permissions) &&
      !hasProtocolManage(resolved.permissions)
    ) {
      const leader = await this.leaderAccess.getLeaderForUser(actorUserId);
      if (!leader) throw new ForbiddenException('Denied');
    }

    return this.prisma.protocolTeamReport.findMany({
      where: {
        ...(from || to
          ? {
              submittedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      include: {
        team: {
          include: {
            occurrence: { select: { title: true, startAt: true } },
          },
        },
        leader: {
          include: {
            member: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });
  }

  async getForTeam(actorUserId: string, teamId: string) {
    const canView = await this.leaderAccess.canManageTeam(actorUserId, teamId);
    if (!canView) {
      const resolved = await this.permissions.resolveForUser(actorUserId);
      if (!hasProtocolManage(resolved.permissions)) {
        throw new ForbiddenException('Denied');
      }
    }
    return this.prisma.protocolTeamReport.findUnique({
      where: { teamId },
      include: {
        leader: {
          include: {
            member: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }
}
