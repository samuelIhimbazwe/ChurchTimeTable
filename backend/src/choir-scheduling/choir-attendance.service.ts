import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChoirAttendanceOutcome } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { CHOIR_SCHEDULING_AUDIT } from './choir-scheduling.constants';
import { hasChoirOpsAttendance, hasChoirOpsView } from './choir-scheduling-access.util';
import { ChoirParticipationService } from './choir-participation.service';

@Injectable()
export class ChoirAttendanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private participation: ChoirParticipationService,
  ) {}

  private async actor(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!hasChoirOpsView(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }
    return resolved;
  }

  async record(
    actorUserId: string,
    data: {
      activityId: string;
      memberId: string;
      outcome: ChoirAttendanceOutcome;
      notes?: string;
    },
  ) {
    const resolved = await this.actor(actorUserId);
    if (!hasChoirOpsAttendance(resolved.permissions)) {
      throw new ForbiddenException('Denied');
    }

    const activity = await this.prisma.choirActivity.findUniqueOrThrow({
      where: { id: data.activityId },
    });
    const settings = await this.prisma.choirEngineSettings.findUniqueOrThrow({
      where: { id: 'default' },
    });
    const scoreEarned = this.participation.outcomeScore(data.outcome, settings);

    const attendance = await this.prisma.choirAttendance.upsert({
      where: {
        activityId_memberId: {
          activityId: data.activityId,
          memberId: data.memberId,
        },
      },
      create: {
        activityId: data.activityId,
        memberId: data.memberId,
        outcome: data.outcome,
        scoreEarned,
        notes: data.notes,
        recordedByUserId: actorUserId,
      },
      update: {
        outcome: data.outcome,
        scoreEarned,
        notes: data.notes,
        recordedByUserId: actorUserId,
        recordedAt: new Date(),
      },
    });

    await this.participation.refreshMemberStats(activity.choirId, data.memberId);

    await this.audit.log({
      userId: actorUserId,
      action: CHOIR_SCHEDULING_AUDIT.ATTENDANCE_RECORDED,
      entity: 'ChoirAttendance',
      entityId: attendance.id,
      newValue: data as Prisma.InputJsonValue,
    });

    return attendance;
  }

  async listForActivity(actorUserId: string, activityId: string) {
    await this.actor(actorUserId);
    return this.prisma.choirAttendance.findMany({
      where: { activityId },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async myHistory(actorUserId: string, choirId?: string) {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { userId: actorUserId },
    });
    return this.prisma.choirAttendance.findMany({
      where: {
        memberId: member.id,
        ...(choirId ? { activity: { choirId } } : {}),
      },
      include: {
        activity: {
          select: {
            title: true,
            activityType: true,
            startAt: true,
            choir: { select: { name: true } },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });
  }
}
