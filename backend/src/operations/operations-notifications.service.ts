import { Injectable } from '@nestjs/common';
import {
  NotificationRuleTrigger,
  NotificationType,
  OperationNotificationKind,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRuleGateService } from '../pilot-ready/notification-rule-gate.service';
import { DEFAULT_REMINDER_DAYS } from './operations.constants';

@Injectable()
export class OperationsNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private ruleGate: NotificationRuleGateService,
  ) {}

  async notifyAssignmentCreated(assignmentId: string) {
    if (!(await this.ruleGate.allows(NotificationRuleTrigger.PROTOCOL_ASSIGNMENT))) {
      return;
    }
    const assignment = await this.loadAssignment(assignmentId);
    const leaders = await this.unitLeaderUserIds(assignment.operationalUnitId);
    for (const userId of leaders) {
      await this.createOpNotification({
        userId,
        kind: 'ASSIGNMENT_CREATED',
        title: `New assignment: ${assignment.occurrence.title}`,
        body: `${assignment.operationalUnit.name} — ${assignment.assignmentType}`,
        occurrenceId: assignment.occurrenceId,
        assignmentId,
      });
      await this.notifications.create(
        userId,
        NotificationType.OPERATION_ASSIGNMENT,
        `Assignment: ${assignment.occurrence.title}`,
        assignment.operationalUnit.name,
      );
    }
    await this.scheduleReminders(assignment);
  }

  async notifyAssignmentStatus(
    assignmentId: string,
    kind: 'ASSIGNMENT_CONFIRMED' | 'ASSIGNMENT_DECLINED',
  ) {
    const assignment = await this.loadAssignment(assignmentId);
    const schedulers = await this.schedulerUserIds();
    for (const userId of schedulers) {
      await this.createOpNotification({
        userId,
        kind,
        title: `${assignment.operationalUnit.name} ${kind === 'ASSIGNMENT_CONFIRMED' ? 'confirmed' : 'declined'}`,
        body: assignment.occurrence.title,
        occurrenceId: assignment.occurrenceId,
        assignmentId,
      });
    }
  }

  async notifyPublished(occurrenceId: string) {
    if (!(await this.ruleGate.allows(NotificationRuleTrigger.SCHEDULE_CHANGE))) {
      return;
    }
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
      include: { assignments: { include: { operationalUnit: true } } },
    });
    const userIds = new Set<string>();
    for (const a of occurrence.assignments) {
      const leaders = await this.unitLeaderUserIds(a.operationalUnitId);
      leaders.forEach((id) => userIds.add(id));
    }
    for (const userId of userIds) {
      await this.createOpNotification({
        userId,
        kind: 'OPERATION_PUBLISHED',
        title: `Schedule published: ${occurrence.title}`,
        occurrenceId,
      });
      await this.notifications.create(
        userId,
        NotificationType.OPERATION_SCHEDULE,
        `Published: ${occurrence.title}`,
        occurrence.startAt.toISOString(),
      );
    }
  }

  async notifyCancelled(occurrenceId: string) {
    const occurrence = await this.prisma.operationOccurrence.findUniqueOrThrow({
      where: { id: occurrenceId },
    });
    const schedulers = await this.schedulerUserIds();
    for (const userId of schedulers) {
      await this.createOpNotification({
        userId,
        kind: 'OPERATION_CANCELLED',
        title: `Operation cancelled: ${occurrence.title}`,
        occurrenceId,
      });
    }
  }

  async notifyConflict(userId: string, occurrenceId: string, message: string) {
    await this.createOpNotification({
      userId,
      kind: 'CONFLICT_DETECTED',
      title: 'Scheduling conflict',
      body: message,
      occurrenceId,
    });
  }

  private async scheduleReminders(assignment: Awaited<ReturnType<typeof this.loadAssignment>>) {
    const leaders = await this.unitLeaderUserIds(assignment.operationalUnitId);
    for (const days of DEFAULT_REMINDER_DAYS) {
      if (days <= 2) {
        if (!(await this.ruleGate.allows(NotificationRuleTrigger.SERVICE_TOMORROW))) {
          continue;
        }
      }
      const scheduledFor = new Date(assignment.occurrence.startAt);
      scheduledFor.setDate(scheduledFor.getDate() - days);
      if (scheduledFor <= new Date()) continue;
      for (const userId of leaders) {
        await this.createOpNotification({
          userId,
          kind: 'ASSIGNMENT_CREATED',
          title: `Reminder (${days}d): ${assignment.occurrence.title}`,
          body: assignment.operationalUnit.name,
          occurrenceId: assignment.occurrenceId,
          assignmentId: assignment.id,
          scheduledFor,
        });
      }
    }
  }

  private async createOpNotification(data: {
    userId: string;
    kind: OperationNotificationKind;
    title: string;
    body?: string;
    occurrenceId?: string;
    assignmentId?: string;
    scheduledFor?: Date;
  }) {
    return this.prisma.operationNotification.create({
      data: {
        userId: data.userId,
        kind: data.kind,
        title: data.title,
        body: data.body,
        occurrenceId: data.occurrenceId,
        assignmentId: data.assignmentId,
        scheduledFor: data.scheduledFor,
        sentAt: data.scheduledFor ? null : new Date(),
      },
    });
  }

  private async loadAssignment(assignmentId: string) {
    return this.prisma.operationAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: {
        operationalUnit: true,
        occurrence: true,
      },
    });
  }

  private async unitLeaderUserIds(operationalUnitId: string) {
    const rows = await this.prisma.operationalUnitLeadershipAssignment.findMany({
      where: { operationalUnitId, endedAt: null },
      include: { member: { select: { userId: true } } },
    });
    return rows.map((r) => r.member.userId).filter(Boolean) as string[];
  }

  private async schedulerUserIds() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 20,
    });
    return users.map((u) => u.id);
  }
}
