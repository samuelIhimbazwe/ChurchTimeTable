import { ForbiddenException, Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { ChoirContextService } from '../choirs/choir-context.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChoirAttendanceOutcome, NotificationType } from '@prisma/client';
import { PILOT_READY_AUDIT } from './pilot-ready.constants';

@Injectable()
export class BulkActionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private choirContext: ChoirContextService,
    private notifications: NotificationsService,
  ) {}

  private async assertBulk(actorUserId: string) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.PILOT_BULK_MANAGE) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_MANAGE)
    ) {
      throw new ForbiddenException('Denied');
    }
    return resolved;
  }

  async members(
    actorUserId: string,
    action:
      | 'ASSIGN_MINISTRY'
      | 'ASSIGN_CHOIR'
      | 'REMOVE_CHOIR'
      | 'ACTIVATE'
      | 'DEACTIVATE',
    payload: {
      memberIds: string[];
      ministryId?: string;
      choirId?: string;
      role?: string;
    },
  ) {
    await this.assertBulk(actorUserId);
    const results: Array<{ memberId: string; status: 'ok' | 'error'; error?: string }> = [];

    for (const memberId of payload.memberIds) {
      try {
        if (action === 'ACTIVATE' || action === 'DEACTIVATE') {
          await this.prisma.member.update({
            where: { id: memberId },
            data: {
              status:
                action === 'ACTIVATE'
                  ? MemberStatus.ACTIVE
                  : MemberStatus.TEMPORARILY_INACTIVE,
            },
          });
        } else if (action === 'ASSIGN_CHOIR' && payload.choirId) {
          const member = await this.prisma.member.findUniqueOrThrow({
            where: { id: memberId },
          });
          await this.choirContext.ensureMembership(
            member.userId,
            payload.choirId,
            payload.role ?? 'MEMBER',
          );
        } else if (action === 'REMOVE_CHOIR' && payload.choirId) {
          const member = await this.prisma.member.findUniqueOrThrow({
            where: { id: memberId },
          });
          await this.prisma.choirMembership.updateMany({
            where: { userId: member.userId, choirId: payload.choirId },
            data: { isActive: false },
          });
        } else if (action === 'ASSIGN_MINISTRY' && payload.ministryId) {
          await this.prisma.ministryMembership.upsert({
            where: {
              ministryId_memberId: {
                ministryId: payload.ministryId,
                memberId,
              },
            },
            create: {
              ministryId: payload.ministryId,
              memberId,
              status: 'ACTIVE',
            },
            update: { status: 'ACTIVE' },
          });
        }
        results.push({ memberId, status: 'ok' });
      } catch (err) {
        results.push({
          memberId,
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed',
        });
      }
    }

    await this.audit.log({
      userId: actorUserId,
      action: PILOT_READY_AUDIT.BULK_ACTION,
      entity: 'BulkAction',
      newValue: { domain: 'members', action, results } as Prisma.InputJsonValue,
    });

    return { action, results, success: results.filter((r) => r.status === 'ok').length };
  }

  async notifyMembers(
    actorUserId: string,
    memberIds: string[],
    title: string,
    body: string,
  ) {
    await this.assertBulk(actorUserId);
    let sent = 0;
    for (const memberId of memberIds) {
      const member = await this.prisma.member.findUnique({ where: { id: memberId } });
      if (!member) continue;
      try {
        await this.notifications.create(
          member.userId,
          NotificationType.GENERAL,
          title,
          body,
          { kind: 'bulk_announcement' },
        );
        sent += 1;
      } catch {
        /* best-effort */
      }
    }
    return { sent, requested: memberIds.length };
  }

  async choirAttendance(
    actorUserId: string,
    records: Array<{ memberId: string; eventId: string; mark: string }>,
  ) {
    await this.assertBulk(actorUserId);
    const markMap: Record<string, ChoirAttendanceOutcome> = {
      ATTENDED: ChoirAttendanceOutcome.PRESENT_FULL,
      LATE: ChoirAttendanceOutcome.PRESENT_LATE,
      EXCUSED_ABSENCE: ChoirAttendanceOutcome.ABSENT_EXCUSED,
      UNEXCUSED_ABSENCE: ChoirAttendanceOutcome.ABSENT_UNEXCUSED,
    };

    const saved = await Promise.all(
      records.map((r) => {
        const outcome = markMap[r.mark] ?? ChoirAttendanceOutcome.PRESENT_FULL;
        const activityId = r.eventId;
        return this.prisma.choirAttendance.upsert({
          where: {
            activityId_memberId: { activityId, memberId: r.memberId },
          },
          create: {
            activityId,
            memberId: r.memberId,
            outcome,
            recordedByUserId: actorUserId,
          },
          update: {
            outcome,
            recordedByUserId: actorUserId,
            recordedAt: new Date(),
          },
        });
      }),
    );

    return { count: saved.length, records: saved };
  }

  async protocolAttendance(
    actorUserId: string,
    records: Array<{ memberId: string; teamId: string; outcome: string }>,
  ) {
    await this.assertBulk(actorUserId);
    return { message: 'Use protocol attendance API per team', recordCount: records.length };
  }
}
