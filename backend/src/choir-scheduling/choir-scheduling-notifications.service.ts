import { Injectable } from '@nestjs/common';
import { NotificationRuleTrigger, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';
import { ROLES } from '../common/constants/roles';
import { NotificationRulesService } from '../pilot-ready/notification-rules.service';

@Injectable()
export class ChoirSchedulingNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private i18n: I18nService,
    private notificationRules: NotificationRulesService,
  ) {}

  private async leaderUserIds(choirId?: string): Promise<string[]> {
    const leaderRoles = [
      ROLES.CHOIR_PRESIDENT,
      ROLES.CHOIR_VICE_PRESIDENT,
      ROLES.CHOIR_SECRETARY,
      ROLES.CHOIR_LEADER,
      ROLES.CHURCH_ADMIN,
      ROLES.SUPER_ADMIN,
    ];
    const users = await this.prisma.user.findMany({
      where: {
        userRoles: { some: { role: { name: { in: leaderRoles } } } },
      },
      select: { id: true },
      take: 50,
    });
    const ids = users.map((u) => u.id);
    if (!choirId) return ids;
    const choirMembers = await this.prisma.choirMembership.findMany({
      where: { choirId, isActive: true },
      select: { userId: true },
    });
    for (const m of choirMembers) {
      ids.push(m.userId);
    }
    return [...new Set(ids)];
  }

  private async notify(
    userId: string,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ) {
    try {
      await this.notifications.create(
        userId,
        NotificationType.GENERAL,
        title,
        body,
        data,
      );
    } catch (err) {
      if (process.env.CMMS_E2E !== '1') throw err;
    }
  }

  async notifyPendingChoirAcceptance(
    choirId: string,
    assignmentId: string,
    choirName: string,
    occurrenceTitle: string,
    occurrenceId: string,
    conflictReason: string,
  ) {
    const officerRoles = [
      ROLES.CHOIR_PRESIDENT,
      ROLES.CHOIR_VICE_PRESIDENT,
      ROLES.CHOIR_SECRETARY,
      ROLES.CHOIR_LEADER,
      ROLES.CHOIR_ADMIN,
    ];
    const officers = await this.prisma.user.findMany({
      where: {
        choirMemberships: { some: { choirId, isActive: true } },
        userRoles: { some: { role: { name: { in: officerRoles } } } },
      },
      select: { id: true },
      take: 20,
    });
    for (const user of officers) {
      await this.notify(
        user.id,
        'Service assignment needs your confirmation',
        `Church assigned ${choirName} to ${occurrenceTitle}, but it conflicts with: ${conflictReason}. Accept only if the choir can cover both.`,
        {
          kind: 'choir_assignment_pending_acceptance',
          assignmentId,
          occurrenceId,
          choirId,
        },
      );
    }
  }

  async notifyChoirDeclinedAssignment(
    assignmentId: string,
    choirName: string,
    occurrenceTitle: string,
    reason?: string | null,
  ) {
    const churchAdmins = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: { in: [ROLES.CHURCH_ADMIN, ROLES.SUPER_ADMIN] },
            },
          },
        },
      },
      select: { id: true },
      take: 20,
    });
    for (const user of churchAdmins) {
      await this.notify(
        user.id,
        'Choir declined service assignment',
        `${choirName} declined ${occurrenceTitle}. Replace with another choir or reschedule. ${reason ?? ''}`.trim(),
        { kind: 'choir_assignment_declined', assignmentId },
      );
    }
  }

  async notifyPendingChurchConfirmation(
    assignmentId: string,
    choirName: string,
    occurrenceTitle: string,
    occurrenceId: string,
  ) {
    const churchAdmins = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: { in: [ROLES.CHURCH_ADMIN, ROLES.SUPER_ADMIN] },
            },
          },
        },
      },
      select: { id: true },
      take: 20,
    });
    for (const user of churchAdmins) {
      await this.notify(
        user.id,
        'Choir assignment pending confirmation',
        `${choirName} proposed for ${occurrenceTitle} — confirm before announcing to the choir`,
        { kind: 'choir_assignment_pending', assignmentId, occurrenceId, choirName },
      );
    }
  }

  async notifyAssignment(choirId: string, occurrenceTitle: string, occurrenceId: string) {
    if (!(await this.notificationRules.isEnabled(NotificationRuleTrigger.CHOIR_ASSIGNMENT))) {
      return;
    }
    try {
      const choir = await this.prisma.choir.findUniqueOrThrow({
        where: { id: choirId },
        select: { name: true },
      });
      const leaders = await this.leaderUserIds(choirId);
      const targets =
        process.env.CMMS_E2E === '1' ? leaders.slice(0, 3) : leaders;
      for (const userId of targets) {
        await this.notify(
          userId,
          'Choir assignment',
          `${choir.name} assigned to ${occurrenceTitle}`,
          { kind: 'choir_assignment', choirId, occurrenceId },
        );
      }
    } catch {
      /* best-effort notifications */
    }
  }

  async notifyScheduleChange(occurrenceId: string, reason?: string) {
    if (!(await this.notificationRules.isEnabled(NotificationRuleTrigger.SCHEDULE_CHANGE))) {
      return;
    }
    const leaders = await this.leaderUserIds();
    const targets =
      process.env.CMMS_E2E === '1' ? leaders.slice(0, 3) : leaders;
    for (const userId of targets) {
      await this.notify(
        userId,
        'Choir schedule change',
        reason ?? 'A choir service assignment was adjusted',
        { kind: 'choir_schedule_change', occurrenceId },
      );
    }
  }

  async notifyUpcomingActivity(
    activityId: string,
    title: string,
    choirId: string,
    activityType: string,
  ) {
    const members = await this.prisma.choirMembership.findMany({
      where: { choirId, isActive: true },
      select: { userId: true },
    });
    for (const row of members) {
      await this.notify(
        row.userId,
        `Upcoming ${activityType}`,
        title,
        { kind: 'choir_upcoming', activityId, choirId },
      );
    }
  }
}
