import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ROLES } from '../common/constants/roles';

@Injectable()
export class ChurchScheduleNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ) {
    try {
      await this.notifications.create(userId, type, title, body, data);
    } catch (err) {
      if (process.env.CMMS_E2E !== '1') throw err;
    }
  }

  private async churchAdminUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: { name: { in: [ROLES.CHURCH_ADMIN, ROLES.SUPER_ADMIN] } },
          },
        },
      },
      select: { id: true },
      take: 30,
    });
    return users.map((u) => u.id);
  }

  async notifyAutoPublished(
    submitterUserId: string,
    submissionId: string,
    title: string,
  ) {
    await this.notify(
      submitterUserId,
      NotificationType.OPERATION_SCHEDULE,
      'Added to church schedule',
      `"${title}" was auto-published on the master timetable.`,
      { kind: 'church_schedule_auto_published', submissionId },
    );

    for (const adminId of await this.churchAdminUserIds()) {
      await this.notify(
        adminId,
        NotificationType.OPERATION_SCHEDULE,
        'Timetable updated',
        `New entry: ${title}`,
        { kind: 'church_schedule_timetable_updated', submissionId },
      );
    }
  }

  async notifyConflictHeld(
    submitterUserId: string,
    submissionId: string,
    title: string,
    conflictReason: string,
  ) {
    await this.notify(
      submitterUserId,
      NotificationType.SCHEDULE_CHANGE,
      'Schedule pending church office',
      `"${title}" is held: ${conflictReason}`,
      { kind: 'church_schedule_conflict_held', submissionId },
    );

    for (const adminId of await this.churchAdminUserIds()) {
      await this.notify(
        adminId,
        NotificationType.SCHEDULE_CHANGE,
        'Action needed: schedule conflict',
        `Conflict on "${title}": ${conflictReason}`,
        { kind: 'church_schedule_conflict_action', submissionId, priority: 'high' },
      );
    }
  }

  async notifyResolved(
    submitterUserId: string,
    submissionId: string,
    title: string,
    outcome: 'published' | 'rejected' | 'counter_proposed',
    detail?: string,
  ) {
    const titles = {
      published: 'Schedule approved',
      rejected: 'Schedule rejected',
      counter_proposed: 'Counter-proposal from church office',
    };
    const bodies = {
      published: `"${title}" was added to the master timetable.`,
      rejected: `"${title}" was not approved. ${detail ?? ''}`.trim(),
      counter_proposed: `Church office suggested a new slot for "${title}". ${detail ?? ''}`.trim(),
    };

    await this.notify(
      submitterUserId,
      NotificationType.SCHEDULE_CHANGE,
      titles[outcome],
      bodies[outcome],
      { kind: `church_schedule_${outcome}`, submissionId },
    );
  }

  async notifyEntryChanged(
    affectedUserIds: string[],
    title: string,
    action: 'edited' | 'cancelled',
    entryId: string,
  ) {
    const copy =
      action === 'cancelled'
        ? `"${title}" was removed from the church timetable.`
        : `"${title}" was updated on the church timetable.`;

    for (const userId of affectedUserIds) {
      await this.notify(
        userId,
        NotificationType.OPERATION_SCHEDULE,
        action === 'cancelled' ? 'Timetable entry cancelled' : 'Timetable entry updated',
        copy,
        { kind: `church_schedule_entry_${action}`, entryId },
      );
    }
  }
}
