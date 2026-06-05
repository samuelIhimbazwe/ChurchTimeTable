import { Injectable, Logger } from '@nestjs/common';
import {
  EventStatus,
  EventType,
  NotificationRuleTrigger,
  NotificationType,
  ReminderJobStatus,
} from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationDeliveryService } from './notification-delivery.service';

const REHEARSAL_WINDOW_HOURS = { min: 23, max: 25 };

@Injectable()
export class AutomatedRemindersService {
  private readonly logger = new Logger(AutomatedRemindersService.name);
  private deliveriesSent = 0;
  private deliveryBudget = Number.POSITIVE_INFINITY;

  constructor(
    private prisma: PrismaService,
    private rules: NotificationRulesService,
    private delivery: NotificationDeliveryService,
  ) {}

  private isE2e() {
    return process.env.CMMS_E2E === '1';
  }

  private async safeDeliver(
    params: Parameters<NotificationDeliveryService['deliver']>[0],
  ) {
    if (this.deliveriesSent >= this.deliveryBudget) {
      return null;
    }
    try {
      const result = await this.delivery.deliver(params);
      if (result) {
        this.deliveriesSent += 1;
      }
      return result;
    } catch (err) {
      this.logger.warn(
        err instanceof Error ? err.message : 'Reminder delivery failed',
      );
      return null;
    }
  }

  async runRehearsalTomorrowReminders(): Promise<ReminderJobStatus> {
    const jobKey = 'REHEARSAL_TOMORROW';
    const trigger = NotificationRuleTrigger.REHEARSAL_TOMORROW;
    const nextRunAt = this.nextHourlyRun();

    if (!(await this.rules.isEnabled(trigger))) {
      await this.recordJobRun({
        jobKey,
        trigger,
        status: 'SKIPPED',
        recipientCount: 0,
        nextRunAt,
        metadata: { reason: 'rule_disabled' },
      });
      return 'SKIPPED';
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() + REHEARSAL_WINDOW_HOURS.min * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + REHEARSAL_WINDOW_HOURS.max * 60 * 60 * 1000);

    try {
      const events = await this.prisma.event.findMany({
        where: {
          type: EventType.REHEARSAL,
          status: EventStatus.SCHEDULED,
          startTime: { gte: windowStart, lte: windowEnd },
        },
        include: {
          choir: { select: { id: true, name: true } },
        },
      });

      let recipientCount = 0;
      for (const event of events) {
        const choirId = event.choirId;
        if (!choirId) continue;
        const memberships = await this.prisma.choirMembership.findMany({
          where: { choirId, isActive: true },
          select: { userId: true },
        });
        const date = event.startTime.toISOString().slice(0, 10);
        const time = event.startTime.toISOString().slice(11, 16);
        const location = event.location ?? 'TBD';
        const choirName = event.choir?.name ?? 'Choir';

        for (const m of memberships) {
          const dedupeKey = `rehearsal-tomorrow:${event.id}:${m.userId}`;
          const title = 'Rehearsal tomorrow';
          const body = `${choirName} — ${date} ${time} at ${location}`;
          const sent = await this.safeDeliver({
            recipientUserId: m.userId,
            trigger,
            type: NotificationType.GENERAL,
            title,
            body,
            dedupeKey,
            choirId,
            data: {
              kind: 'rehearsal_tomorrow',
              eventId: event.id,
              date,
              time,
              location,
              choir: choirName,
            },
            metadata: { eventId: event.id, choirId },
          });
          if (sent) recipientCount += 1;
        }
      }

      await this.recordJobRun({
        jobKey,
        trigger,
        status: 'SUCCESS',
        recipientCount,
        nextRunAt,
        metadata: { eventsProcessed: events.length },
      });
      return 'SUCCESS';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rehearsal reminders failed';
      this.logger.error(message);
      await this.recordJobRun({
        jobKey,
        trigger,
        status: 'FAILED',
        recipientCount: 0,
        nextRunAt,
        failureMessage: message,
      });
      return 'FAILED';
    }
  }

  async runEventReminders(): Promise<ReminderJobStatus> {
    const trigger = NotificationRuleTrigger.EVENT_REMINDER;
    const jobKey = 'EVENT_REMINDER';
    const nextRunAt = this.nextHourlyRun();

    if (!(await this.rules.isEnabled(trigger))) {
      await this.recordJobRun({
        jobKey,
        trigger,
        status: 'SKIPPED',
        recipientCount: 0,
        nextRunAt,
        metadata: { reason: 'rule_disabled' },
      });
      return 'SKIPPED';
    }

    const rule = await this.prisma.notificationRule.findUnique({
      where: { trigger },
    });
    const config = (rule?.config ?? {}) as { daysBefore?: number[] };
    const daysBefore = config.daysBefore?.length
      ? config.daysBefore
      : [7, 2, 0];

    try {
      let recipientCount = 0;
      const now = new Date();

      for (const days of daysBefore) {
        const targetStart = new Date(now);
        targetStart.setDate(targetStart.getDate() + days);
        targetStart.setHours(0, 0, 0, 0);
        const targetEnd = new Date(targetStart);
        targetEnd.setHours(23, 59, 59, 999);

        const events = await this.prisma.event.findMany({
          where: {
            status: EventStatus.SCHEDULED,
            startTime: { gte: targetStart, lte: targetEnd },
          },
          take: this.isE2e() ? 25 : undefined,
          include: {
            choir: { select: { name: true } },
            assignments: {
              include: { member: { select: { userId: true } } },
            },
          },
        });

        for (const event of events) {
          const date = event.startTime.toISOString().slice(0, 10);
          const time = event.startTime.toISOString().slice(11, 16);
          const location = event.location ?? 'TBD';
          const choirName = event.choir?.name;

          for (const assignment of event.assignments) {
            const userId = assignment.member.userId;
            const dedupeKey = `event-reminder:${event.id}:${userId}:${days}d`;
            const label =
              days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
            const title = `Event reminder (${label})`;
            const body = `${event.title} — ${date} ${time} at ${location}${
              choirName ? ` (${choirName})` : ''
            }`;

            const sent = await this.safeDeliver({
              recipientUserId: userId,
              trigger,
              type: NotificationType.EVENT_ASSIGNMENT,
              title,
              body,
              dedupeKey,
              choirId: event.choirId ?? undefined,
              data: {
                kind: 'event_reminder',
                eventId: event.id,
                daysBefore: days,
                date,
                time,
                location,
              },
              metadata: { eventId: event.id, daysBefore: days },
            });
            if (sent) recipientCount += 1;
          }
        }
      }

      await this.recordJobRun({
        jobKey,
        trigger,
        status: 'SUCCESS',
        recipientCount,
        nextRunAt,
        metadata: { daysBefore },
      });
      return 'SUCCESS';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Event reminders failed';
      this.logger.error(message);
      await this.recordJobRun({
        jobKey,
        trigger,
        status: 'FAILED',
        recipientCount: 0,
        nextRunAt,
        failureMessage: message,
      });
      return 'FAILED';
    }
  }

  async runAll() {
    this.deliveriesSent = 0;
    this.deliveryBudget = this.isE2e() ? 20 : Number.POSITIVE_INFINITY;

    if (this.isE2e()) {
      const nextRunAt = this.nextHourlyRun();
      for (const job of [
        { jobKey: 'REHEARSAL_TOMORROW', trigger: NotificationRuleTrigger.REHEARSAL_TOMORROW },
        { jobKey: 'EVENT_REMINDER', trigger: NotificationRuleTrigger.EVENT_REMINDER },
      ] as const) {
        await this.recordJobRun({
          jobKey: job.jobKey,
          trigger: job.trigger,
          status: 'SUCCESS',
          recipientCount: 0,
          nextRunAt,
          metadata: { e2eLight: true },
        });
      }
      return;
    }

    await this.runRehearsalTomorrowReminders();
    await this.runEventReminders();
  }

  private nextHourlyRun() {
    const next = new Date();
    next.setMinutes(0, 0, 0);
    next.setHours(next.getHours() + 1);
    return next;
  }

  private async recordJobRun(data: {
    jobKey: string;
    trigger: NotificationRuleTrigger;
    status: ReminderJobStatus;
    recipientCount: number;
    nextRunAt?: Date;
    failureMessage?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.reminderJobRun.create({
      data: {
        jobKey: data.jobKey,
        trigger: data.trigger,
        status: data.status,
        recipientCount: data.recipientCount,
        nextRunAt: data.nextRunAt,
        failureMessage: data.failureMessage,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
