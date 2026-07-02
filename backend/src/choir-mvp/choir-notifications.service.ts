import { Injectable } from '@nestjs/common';
import { NotificationType, WelfareCaseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { I18nService } from '../i18n/i18n.service';

const SPAM_WINDOW_MS = 24 * 60 * 60 * 1000;
const E2E_AUDIENCE_LIMIT = 3;

@Injectable()
export class ChoirNotificationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private i18n: I18nService,
  ) {}

  private async runBestEffort(task: () => Promise<void>) {
    try {
      await task();
    } catch (err) {
      if (process.env.CMMS_E2E !== '1') throw err;
    }
  }

  private async shouldNotify(
    userId: string,
    kind: string,
    entityId: string,
  ): Promise<boolean> {
    const since = new Date(Date.now() - SPAM_WINDOW_MS);
    const recent = await this.prisma.notification.findMany({
      where: { userId, createdAt: { gte: since } },
      take: 30,
      orderBy: { createdAt: 'desc' },
    });
    return !recent.some((row) => {
      const payload = row.data as { kind?: string; entityId?: string } | null;
      return payload?.kind === kind && payload?.entityId === entityId;
    });
  }

  private async userLocale(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });
    return this.i18n.resolveLocale(user?.preferredLanguage ?? 'en');
  }

  private async notifyUser(
    userId: string,
    titleKey: string,
    bodyKey: string,
    params: Record<string, string | number>,
    data: Record<string, unknown>,
  ) {
    const locale = await this.userLocale(userId);
    const title = this.i18n.translate(locale, titleKey, titleKey, params);
    const body = this.i18n.translate(locale, bodyKey, bodyKey, params);
    await this.notifications.create(
      userId,
      NotificationType.GENERAL,
      title,
      body,
      data,
    );
  }

  async notifyWelfareCaseOpened(caseId: string, title: string, memberUserId?: string) {
    await this.runBestEffort(async () => {
      const leaders = await this.leaderUserIds();
      for (const userId of leaders) {
        if (!(await this.shouldNotify(userId, 'welfare_case_opened', caseId))) continue;
        await this.notifyUser(
          userId,
          'WELFARE_NOTIFY_OPENED_TITLE',
          'WELFARE_NOTIFY_OPENED_BODY',
          { title },
          { kind: 'welfare_case_opened', entityId: caseId, caseId },
        );
      }
      if (memberUserId && !leaders.includes(memberUserId)) {
        if (await this.shouldNotify(memberUserId, 'welfare_case_opened', caseId)) {
          await this.notifyUser(
            memberUserId,
            'WELFARE_NOTIFY_OPENED_TITLE',
            'WELFARE_NOTIFY_OPENED_BODY',
            { title },
            { kind: 'welfare_case_opened', entityId: caseId, caseId },
          );
        }
      }
    });
  }

  async notifyWelfareStatusChange(
    caseId: string,
    title: string,
    status: WelfareCaseStatus,
    memberUserId?: string,
  ) {
    await this.runBestEffort(async () => {
      const key =
        status === WelfareCaseStatus.APPROVED
          ? 'approved'
          : status === WelfareCaseStatus.CLOSED
            ? 'closed'
            : status === WelfareCaseStatus.FUNDED ||
                status === WelfareCaseStatus.PARTIALLY_FUNDED
              ? 'funded'
              : 'updated';

      const titleKey =
        key === 'approved'
          ? 'WELFARE_NOTIFY_APPROVED_TITLE'
          : key === 'closed'
            ? 'WELFARE_NOTIFY_CLOSED_TITLE'
            : key === 'funded'
              ? 'WELFARE_NOTIFY_FUNDED_TITLE'
              : 'WELFARE_NOTIFY_UPDATED_TITLE';

      const bodyKey =
        key === 'approved'
          ? 'WELFARE_NOTIFY_APPROVED_BODY'
          : key === 'closed'
            ? 'WELFARE_NOTIFY_CLOSED_BODY'
            : key === 'funded'
              ? 'WELFARE_NOTIFY_FUNDED_BODY'
              : 'WELFARE_NOTIFY_UPDATED_BODY';

      const targets = new Set(await this.leaderUserIds());
      if (memberUserId) targets.add(memberUserId);

      for (const userId of targets) {
        if (!(await this.shouldNotify(userId, `welfare_case_${key}`, caseId))) continue;
        await this.notifyUser(
          userId,
          titleKey,
          bodyKey,
          { title },
          { kind: `welfare_case_${key}`, entityId: caseId, caseId, status },
        );
      }
    });
  }

  async notifyRehearsalScheduled(eventId: string, title: string, startTime: Date) {
    await this.runBestEffort(async () => {
      const userIds = await this.rehearsalAudienceUserIds();
      for (const userId of userIds) {
        if (!(await this.shouldNotify(userId, 'rehearsal_scheduled', eventId))) continue;
        await this.notifyUser(
          userId,
          'REHEARSAL_NOTIFY_SCHEDULED_TITLE',
          'REHEARSAL_NOTIFY_SCHEDULED_BODY',
          { title, date: startTime.toISOString().slice(0, 10) },
          { kind: 'rehearsal_scheduled', entityId: eventId, eventId },
        );
      }
    });
  }

  async notifyRehearsalPlanUpdated(eventId: string, title: string) {
    await this.runBestEffort(async () => {
      const userIds = await this.rehearsalAudienceUserIds();
      for (const userId of userIds) {
        if (!(await this.shouldNotify(userId, 'rehearsal_plan_updated', eventId))) continue;
        await this.notifyUser(
          userId,
          'REHEARSAL_NOTIFY_PLAN_TITLE',
          'REHEARSAL_NOTIFY_PLAN_BODY',
          { title },
          { kind: 'rehearsal_plan_updated', entityId: eventId, eventId },
        );
      }
    });
  }

  private async leaderUserIds(): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: {
        role: {
          name: {
            in: [
              'CHOIR_PRESIDENT',
              'CHOIR_VICE_PRESIDENT',
              'CHOIR_TREASURER',
              'CHOIR_FAMILY_COORDINATOR',
            ],
          },
        },
      },
      select: { userId: true },
      ...(process.env.CMMS_E2E === '1' ? { take: E2E_AUDIENCE_LIMIT } : {}),
    });
    return [...new Set(rows.map((row) => row.userId))];
  }

  private async rehearsalAudienceUserIds(): Promise<string[]> {
    const rows = await this.prisma.user.findMany({
      where: {
        isActive: true,
        member: { ministry: 'CHOIR', status: 'ACTIVE' },
      },
      select: { id: true },
      take: process.env.CMMS_E2E === '1' ? E2E_AUDIENCE_LIMIT : 500,
    });
    return rows.map((row) => row.id);
  }
}
