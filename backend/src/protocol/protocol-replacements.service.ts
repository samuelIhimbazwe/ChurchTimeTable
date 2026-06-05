import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ProtocolReplacementStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PROTOCOL_AUDIT } from './protocol.constants';
import {
  hasProtocolReplacementManage,
  hasProtocolView,
} from './protocol-access.util';
import { ProtocolPerformanceService } from './protocol-performance.service';
import { ProtocolNotificationsService } from './protocol-notifications.service';

@Injectable()
export class ProtocolReplacementsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private performance: ProtocolPerformanceService,
    private notifications: ProtocolNotificationsService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasProtocolView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return { permissions: resolved.permissions };
  }

  async createRequest(
    actorUserId: string,
    params: {
      teamMemberId: string;
      replacementMemberId: string;
      reason?: string;
    },
  ) {
    const { permissions } = await this.actor(actorUserId);
    const assignment =
      await this.prisma.protocolOccurrenceTeamMember.findUniqueOrThrow({
        where: { id: params.teamMemberId },
        include: { member: true },
      });

    const actorMember = await this.prisma.member.findUnique({
      where: { userId: actorUserId },
    });
    const isSelf = actorMember?.id === assignment.memberId;
    if (!isSelf && !hasProtocolReplacementManage(permissions)) {
      throw new ForbiddenException('Denied');
    }

    const request = await this.prisma.protocolReplacementRequest.create({
      data: {
        teamMemberId: params.teamMemberId,
        originalMemberId: assignment.memberId,
        replacementMemberId: params.replacementMemberId,
        reason: params.reason,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.REPLACEMENT_REQUESTED,
      entity: 'ProtocolReplacementRequest',
      entityId: request.id,
      newValue: params as Prisma.InputJsonValue,
    });

    return request;
  }

  async review(
    actorUserId: string,
    requestId: string,
    status: ProtocolReplacementStatus,
  ) {
    const { permissions } = await this.actor(actorUserId);
    if (!hasProtocolReplacementManage(permissions)) {
      throw new ForbiddenException('Replacement review denied');
    }

    const request = await this.prisma.protocolReplacementRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { teamMember: true },
    });

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request already reviewed');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const reviewed = await tx.protocolReplacementRequest.update({
        where: { id: requestId },
        data: {
          status,
          reviewedByUserId: actorUserId,
          reviewedAt: new Date(),
        },
      });

      if (status === 'APPROVED') {
        await tx.protocolOccurrenceTeamMember.create({
          data: {
            teamId: request.teamMember.teamId,
            memberId: request.replacementMemberId,
            assignmentType: 'REPLACEMENT',
          },
        });
        await tx.protocolTeamAttendance.upsert({
          where: { teamMemberId: request.teamMemberId },
          create: {
            teamMemberId: request.teamMemberId,
            outcome: 'ABSENT_SELF_REPLACED',
            recordedByUserId: actorUserId,
          },
          update: {
            outcome: 'ABSENT_SELF_REPLACED',
            recordedByUserId: actorUserId,
          },
        });
      }

      return reviewed;
    });

    if (status === 'APPROVED') {
      await this.performance.refreshMemberStats(request.originalMemberId);
      await this.performance.refreshMemberStats(request.replacementMemberId);
      const notifyPromise =
        this.notifications.notifyReplacementApproved(requestId);
      if (process.env.CMMS_E2E === '1') {
        await notifyPromise;
      } else {
        void notifyPromise;
      }
    }

    await this.audit.log({
      userId: actorUserId,
      action: PROTOCOL_AUDIT.REPLACEMENT_REVIEWED,
      entity: 'ProtocolReplacementRequest',
      entityId: requestId,
      newValue: { status } as Prisma.InputJsonValue,
    });

    return updated;
  }

  async listPending(actorUserId: string) {
    await this.actor(actorUserId);
    return this.prisma.protocolReplacementRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        originalMember: {
          select: { id: true, firstName: true, lastName: true },
        },
        replacementMember: {
          select: { id: true, firstName: true, lastName: true },
        },
        teamMember: {
          include: {
            team: {
              include: {
                occurrence: { select: { title: true, startAt: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
