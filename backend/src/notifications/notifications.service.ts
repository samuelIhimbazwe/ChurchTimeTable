import { Injectable } from '@nestjs/common';

import {

  DisciplineCase,

  NotificationType,

  Prisma,

} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { FcmService } from './fcm.service';

import { AppLocale, I18nService } from '../i18n/i18n.service';



@Injectable()

export class NotificationsService {

  constructor(

    private prisma: PrismaService,

    private fcm: FcmService,

    private i18n: I18nService,

  ) {}



  private async userLocale(userId: string): Promise<AppLocale> {

    const user = await this.prisma.user.findUnique({

      where: { id: userId },

      select: { preferredLanguage: true },

    });

    return this.i18n.resolveLocale(user?.preferredLanguage ?? 'rw');

  }



  private memberDisplayName(member: {
    firstName: string;
    lastName: string;
    memberNumber?: string | null;
  }): string {
    const name = `${member.firstName} ${member.lastName}`.trim();
    if (member.memberNumber) {
      return `${name} (${member.memberNumber})`;
    }
    return name;
  }



  async create(

    userId: string,

    type: NotificationType,

    title: string,

    body: string,

    data?: Record<string, unknown>,

    choirId?: string,

    ministryId?: string,

  ) {

    const notification = await this.prisma.notification.create({
      data: {
        userId,
        choirId: choirId ?? null,
        ministryId: ministryId ?? null,
        type,
        title,
        body,
        data: (data as Prisma.InputJsonValue) ?? undefined,
      },
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });
      if (user?.fcmToken) {
        const stringData: Record<string, string> = {};
        if (data) {
          for (const [k, v] of Object.entries(data)) {
            stringData[k] = String(v);
          }
        }
        await this.fcm.sendToToken(user.fcmToken, title, body, stringData, userId);
      }
    } catch {
      /* FCM lookup/send is best-effort */
    }

    return notification;

  }



  async notifyMemberAssignment(
    assignment: {
      id: string;
      memberId: string;
      occurrenceId: string;
      occurrence?: { title: string };
    },
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: assignment.memberId },
    });
    if (!member) return;

    const occurrence =
      assignment.occurrence ??
      (await this.prisma.operationOccurrence.findUnique({
        where: { id: assignment.occurrenceId },
        select: { title: true },
      }));

    const locale = await this.userLocale(member.userId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_EVENT_ASSIGNMENT_TITLE',
      'NOTIFICATION_EVENT_ASSIGNMENT_BODY',
      { eventName: occurrence?.title ?? '' },
    );
    await this.create(
      member.userId,
      NotificationType.EVENT_ASSIGNMENT,
      msg.title,
      msg.body,
      { occurrenceId: assignment.occurrenceId, assignmentId: assignment.id },
    );
  }

  /** @deprecated Legacy swap notifications — swaps removed; no-op for compatibility */
  async notifySwap(
    _swap: { id: string; eventId: string; targetId: string; requesterId: string },
    _action: string,
  ) {
    return;
  }

  /** @deprecated Legacy swap notifications — swaps removed; no-op for compatibility */
  async notifySwapPendingLeader(
    _swap: { id: string; eventId: string },
  ) {
    return;
  }

  async notifyReplacement(
    record: {
      id: string;
      originalMemberId: string;
      replacementMemberId: string;
      originalMember?: { firstName: string; lastName: string; userId: string };
      replacementMember?: { firstName: string; lastName: string; userId: string };
      occurrenceTitle?: string;
    },
    action: string,
  ) {
    const occurrenceName = record.occurrenceTitle ?? '';

    const absent =
      record.originalMember ??
      (await this.prisma.member.findUnique({
        where: { id: record.originalMemberId },
      }));
    if (!absent) return;

    const absentName = this.memberDisplayName(absent);
    const cover =
      record.replacementMember ??
      (await this.prisma.member.findUnique({
        where: { id: record.replacementMemberId },
      }));
    const coverName = cover ? this.memberDisplayName(cover) : '';

    const bodyKeyByAction: Record<string, string> = {
      requested: 'NOTIFICATION_REPLACEMENT_REQUESTED_BODY',
      cover_assigned: 'NOTIFICATION_REPLACEMENT_COVER_ASSIGNED_BODY',
      approved: 'NOTIFICATION_REPLACEMENT_APPROVED_BODY',
      rejected: 'NOTIFICATION_REPLACEMENT_REJECTED_BODY',
      finalized: 'NOTIFICATION_REPLACEMENT_FINALIZED_BODY',
    };
    const bodyKey = bodyKeyByAction[action];
    if (!bodyKey) return;

    const recipientUserIds = new Set<string>();
    if (
      action === 'requested' ||
      action === 'rejected' ||
      action === 'approved' ||
      action === 'finalized'
    ) {
      recipientUserIds.add(absent.userId);
    }
    if (
      cover?.userId &&
      (action === 'cover_assigned' || action === 'approved' || action === 'finalized')
    ) {
      recipientUserIds.add(cover.userId);
    }
    if (action === 'requested' || action === 'cover_assigned') {
      const leaders = await this.protocolOversightUserIds('TEAM_HEAD');
      leaders.forEach((id) => recipientUserIds.add(id));
    }

    for (const userId of recipientUserIds) {
      const locale = await this.userLocale(userId);
      const msg = this.i18n.notification(
        locale,
        'NOTIFICATION_REPLACEMENT_TITLE',
        bodyKey,
        { memberName: coverName || absentName, eventName: occurrenceName },
      );
      await this.create(userId, NotificationType.SWAP, msg.title, msg.body, {
        replacementId: record.id,
        action,
      });
    }
  }

  async notifyReplacementPendingLeader(record: {
    id: string;
    occurrenceTitle?: string;
  }) {
    const recipients = await this.protocolOversightUserIds('TEAM_HEAD');
    const eventName = record.occurrenceTitle ?? '';
    for (const userId of recipients) {
      const locale = await this.userLocale(userId);
      const msg = this.i18n.notification(
        locale,
        'NOTIFICATION_REPLACEMENT_PENDING_LEADER_TITLE',
        'NOTIFICATION_REPLACEMENT_PENDING_LEADER_BODY',
        { eventName },
      );
      await this.create(userId, NotificationType.SWAP, msg.title, msg.body, {
        replacementId: record.id,
      });
    }
  }

  async notifyReplacementApproved(requestId: string) {
    const request = await this.prisma.protocolReplacementRequest.findUnique({
      where: { id: requestId },
      include: {
        replacementMember: { select: { userId: true, firstName: true, lastName: true } },
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
    });
    if (!request?.replacementMember.userId) return;

    const occ = request.teamMember.team.occurrence;
    const locale = await this.userLocale(request.replacementMember.userId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_REPLACEMENT_TITLE',
      'NOTIFICATION_REPLACEMENT_APPROVED_BODY',
      { memberName: this.memberDisplayName(request.replacementMember), eventName: occ.title },
    );
    await this.create(
      request.replacementMember.userId,
      NotificationType.SWAP,
      msg.title,
      msg.body,
      { kind: 'protocol_replacement_approved', requestId },
    );
  }

  async notifyCoverageEscalation(params: {
    entity: 'swap' | 'replacement';
    entityId: string;
    level: string;
    memberName: string;
    eventTitle: string;
    notes?: string;
  }) {
    const recipients = await this.protocolOversightUserIds(params.level);
    for (const userId of recipients) {
      const locale = await this.userLocale(userId);
      const msg = this.i18n.notification(
        locale,
        'NOTIFICATION_COVERAGE_ESCALATION_TITLE',
        'NOTIFICATION_COVERAGE_ESCALATION_BODY',
        {
          memberName: params.memberName,
          eventName: params.eventTitle,
          level: params.level,
          notes: params.notes ?? '',
        },
      );
      await this.create(userId, NotificationType.SWAP, msg.title, msg.body, {
        entity: params.entity,
        entityId: params.entityId,
        level: params.level,
      });
    }
  }

  async notifyReadinessWarning(params: {
    occurrenceId: string;
    eventTitle: string;
    status: string;
  }) {
    const recipients = await this.protocolOversightUserIds('COORDINATOR');
    for (const userId of recipients) {
      const locale = await this.userLocale(userId);
      const msg = this.i18n.notification(
        locale,
        'NOTIFICATION_READINESS_WARNING_TITLE',
        'NOTIFICATION_READINESS_WARNING_BODY',
        { eventName: params.eventTitle, status: params.status },
      );
      await this.create(userId, NotificationType.SWAP, msg.title, msg.body, {
        occurrenceId: params.occurrenceId,
        status: params.status,
      });
    }
  }

  async notifyAttendanceAbsenceRisk(record: {
    id: string;
    memberId: string;
    occurrenceId?: string;
    occurrenceTitle?: string;
  }) {
    const teamHeadUserId = await this.findProtocolTeamHeadUserId(record.memberId);
    if (!teamHeadUserId) return;

    const occurrenceTitle =
      record.occurrenceTitle ??
      (
        record.occurrenceId
          ? await this.prisma.operationOccurrence.findUnique({
              where: { id: record.occurrenceId },
              select: { title: true },
            })
          : null
      )?.title ??
      '';

    const locale = await this.userLocale(teamHeadUserId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_ATTENDANCE_ABSENCE_TITLE',
      'NOTIFICATION_ATTENDANCE_ABSENCE_BODY',
      { eventName: occurrenceTitle },
    );

    await this.create(teamHeadUserId, NotificationType.ATTENDANCE, msg.title, msg.body, {
      attendanceId: record.id,
      occurrenceId: record.occurrenceId,
    });
  }

  async notifyAttendanceEscalation(params: {
    attendanceId: string;
    level: string;
    memberName: string;
    eventTitle: string;
    notes?: string;
  }) {
    const recipients = await this.protocolOversightUserIds(params.level);
    for (const userId of recipients) {
      const locale = await this.userLocale(userId);
      const msg = this.i18n.notification(
        locale,
        'NOTIFICATION_ATTENDANCE_ESCALATION_TITLE',
        'NOTIFICATION_ATTENDANCE_ESCALATION_BODY',
        {
          memberName: params.memberName,
          eventName: params.eventTitle,
          level: params.level,
          notes: params.notes ?? '',
        },
      );
      await this.create(userId, NotificationType.ATTENDANCE, msg.title, msg.body, {
        attendanceId: params.attendanceId,
        level: params.level,
      });
    }
  }

  private async findProtocolTeamHeadUserId(memberId: string) {
    const now = new Date();
    const membership = await this.prisma.protocolServiceTeamMember.findFirst({
      where: {
        memberId,
        team: { month: now.getMonth() + 1, year: now.getFullYear() },
      },
      include: { team: { include: { teamHead: true } } },
    });
    if (!membership?.team.teamHead) return null;
    const user = await this.prisma.user.findFirst({
      where: { member: { id: membership.team.teamHeadId } },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  private async protocolOversightUserIds(level: string) {
    const roleNames =
      level === 'PRESIDENT'
        ? ['PROTOCOL_LEADER', 'SUPER_ADMIN']
        : level === 'COORDINATOR'
          ? ['PROTOCOL_LEADER', 'CHOIR_LEADER']
          : ['PROTOCOL_LEADER'];

    const users = await this.prisma.user.findMany({
      where: {
        userRoles: { some: { role: { name: { in: roleNames } } } },
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async notifyAttendanceUpdate(record: {
    id: string;
    memberId: string;
    occurrenceId?: string;
    status?: string;
  }) {
    const [member, occurrence] = await Promise.all([
      this.prisma.member.findUnique({ where: { id: record.memberId } }),
      record.occurrenceId
        ? this.prisma.operationOccurrence.findUnique({
            where: { id: record.occurrenceId },
            select: { title: true },
          })
        : Promise.resolve(null),
    ]);
    if (!member) return;

    const locale = await this.userLocale(member.userId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_ATTENDANCE_TITLE',
      'NOTIFICATION_ATTENDANCE_BODY',
      { eventName: occurrence?.title ?? '' },
    );

    await this.create(
      member.userId,
      NotificationType.ATTENDANCE,
      msg.title,
      msg.body,
      {
        attendanceId: record.id,
        occurrenceId: record.occurrenceId,
        status: record.status,
      },
    );
  }

  async notifyExcusedReview(
    record: { id: string; memberId: string; occurrenceId?: string },
    approved: boolean,
  ) {
    const [member, occurrence] = await Promise.all([
      this.prisma.member.findUnique({ where: { id: record.memberId } }),
      record.occurrenceId
        ? this.prisma.operationOccurrence.findUnique({
            where: { id: record.occurrenceId },
            select: { title: true },
          })
        : Promise.resolve(null),
    ]);
    if (!member) return;

    const locale = await this.userLocale(member.userId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_EXCUSED_REVIEW_TITLE',
      approved
        ? 'NOTIFICATION_EXCUSED_APPROVED_BODY'
        : 'NOTIFICATION_EXCUSED_REJECTED_BODY',
      { eventName: occurrence?.title ?? '' },
    );

    await this.create(member.userId, NotificationType.ATTENDANCE, msg.title, msg.body, {
      attendanceId: record.id,
      occurrenceId: record.occurrenceId,
      approved,
    });
  }



  async notifyDiscipline(record: DisciplineCase) {

    const member = await this.prisma.member.findUnique({

      where: { id: record.memberId },

    });

    if (!member) return;



    const locale = await this.userLocale(member.userId);

    const msg = this.i18n.notification(

      locale,

      'NOTIFICATION_DISCIPLINE_TITLE',

      'NOTIFICATION_DISCIPLINE_BODY',

      { caseTitle: record.title },

    );

    await this.create(

      member.userId,

      NotificationType.DISCIPLINE,

      msg.title,

      msg.body,

      { caseId: record.id, caseTitle: record.title },

    );

  }



  async listForUser(
    userId: string,
    page = 1,
    limit = 20,
    options: {
      unreadOnly?: boolean;
      archived?: boolean;
      q?: string;
      type?: NotificationType;
    } = {},
  ) {
    const { unreadOnly = false, archived = false, q, type } = options;
    const { skip, take } = { skip: (page - 1) * limit, take: limit };

    const where: Prisma.NotificationWhereInput = {
      userId,
      archived,
      ...(unreadOnly ? { read: false } : {}),
      ...(type ? { type } : {}),
      ...(q?.trim()
        ? {
            OR: [
              { title: { contains: q.trim() } },
              { body: { contains: q.trim() } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([

      this.prisma.notification.findMany({

        where,

        skip,

        take,

        orderBy: { createdAt: 'desc' },

      }),

      this.prisma.notification.count({ where }),

    ]);

    return {

      items,

      meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },

    };

  }



  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false, archived: false },
      data: { read: true },
    });
  }

  async archive(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { archived: true, read: true },
    });
  }

  async unarchive(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { archived: false },
    });
  }

  async notifyMemberApproved(userId: string) {
    const locale = await this.userLocale(userId);
    const title = this.i18n.translate(locale, 'NOTIFICATION_MEMBER_APPROVED_TITLE');
    const body = this.i18n.translate(locale, 'NOTIFICATION_MEMBER_APPROVED_BODY');
    return this.create(userId, NotificationType.GENERAL, title, body, {
      kind: 'MEMBER_APPROVED',
    });
  }

  async notifyMemberRejected(userId: string) {
    const locale = await this.userLocale(userId);
    const title = this.i18n.translate(locale, 'NOTIFICATION_MEMBER_REJECTED_TITLE');
    const body = this.i18n.translate(locale, 'NOTIFICATION_MEMBER_REJECTED_BODY');
    return this.create(userId, NotificationType.GENERAL, title, body, {
      kind: 'MEMBER_REJECTED',
    });
  }

  /** Sprint F — localized thank-you acknowledgment in the member notification feed. */
  async sendContributionThankYou(event: {
    userId: string;
    memberName: string;
    memberNumber: string;
    contributionType: string;
    amount: number;
    currency: string;
    contributionId: string;
    referenceNumber: string;
  }) {
    const locale = await this.userLocale(event.userId);
    const params = {
      memberName: event.memberName,
      memberNumber: event.memberNumber,
      contributionType: event.contributionType,
      amount: event.amount,
      currency: event.currency,
    };
    const title = this.i18n.translate(
      locale,
      'CONTRIBUTION_THANK_YOU_TITLE',
      undefined,
      params,
    );
    const body = this.i18n.translate(
      locale,
      'CONTRIBUTION_THANK_YOU_MESSAGE',
      undefined,
      params,
    );
    return this.create(event.userId, NotificationType.GENERAL, title, body, {
      kind: 'contribution_thank_you',
      contributionId: event.contributionId,
      referenceNumber: event.referenceNumber,
      amount: event.amount,
      currency: event.currency,
      contributionType: event.contributionType,
      memberNumber: event.memberNumber,
    });
  }

  /** Sprint E — legacy confirmation notice (superseded by thank-you workflow). */
  async onContributionConfirmed(event: {
    userId: string;
    amount: number;
    currency: string;
    referenceNumber: string;
    contributionId: string;
    contributionType: string;
  }) {
    const locale = await this.userLocale(event.userId);
    const title = this.i18n.translate(
      locale,
      'NOTIFICATION_CONTRIBUTION_CONFIRMED_TITLE',
      'Contribution confirmed',
    );
    const body = this.i18n.translate(
      locale,
      'NOTIFICATION_CONTRIBUTION_CONFIRMED_BODY',
      `Your contribution ${event.referenceNumber} has been confirmed.`,
    );
    return this.create(event.userId, NotificationType.GENERAL, title, body, {
      kind: 'contribution_confirmed',
      contributionId: event.contributionId,
      referenceNumber: event.referenceNumber,
      amount: event.amount,
      currency: event.currency,
      contributionType: event.contributionType,
    });
  }

}

