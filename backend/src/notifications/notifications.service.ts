import { Injectable } from '@nestjs/common';

import {

  Attendance,

  DisciplineCase,

  EventAssignment,

  NotificationType,

  Prisma,

  Swap,

  Replacement,

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

  ) {

    const notification = await this.prisma.notification.create({

      data: {

        userId,

        type,

        title,

        body,

        data: (data as Prisma.InputJsonValue) ?? undefined,

      },

    });



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



    return notification;

  }



  async notifyMemberAssignment(

    assignment: EventAssignment & {

      event?: { title: string };

    },

  ) {

    const member = await this.prisma.member.findUnique({

      where: { id: assignment.memberId },

    });

    if (!member) return;



    const event = assignment.event ??

      (await this.prisma.event.findUnique({

        where: { id: assignment.eventId },

        select: { title: true },

      }));



    const locale = await this.userLocale(member.userId);

    const msg = this.i18n.notification(

      locale,

      'NOTIFICATION_EVENT_ASSIGNMENT_TITLE',

      'NOTIFICATION_EVENT_ASSIGNMENT_BODY',

      { eventName: event?.title ?? '' },

    );

    await this.create(

      member.userId,

      NotificationType.EVENT_ASSIGNMENT,

      msg.title,

      msg.body,

      { eventId: assignment.eventId, assignmentId: assignment.id },

    );

  }



  async notifySwap(swap: Swap, action: string) {

    const [target, requester, event] = await Promise.all([

      this.prisma.member.findUnique({ where: { id: swap.targetId } }),

      this.prisma.member.findUnique({ where: { id: swap.requesterId } }),

      this.prisma.event.findUnique({

        where: { id: swap.eventId },

        select: { title: true },

      }),

    ]);



    const eventName = event?.title ?? '';



    if (target && requester) {

      const requesterName = this.memberDisplayName(requester);

      const targetName = this.memberDisplayName(target);



      if (action === 'requested') {

        const locale = await this.userLocale(target.userId);

        const msg = this.i18n.notification(

          locale,

          'NOTIFICATION_SWAP_TITLE',

          'NOTIFICATION_SWAP_REQUESTED_BODY',

          { memberName: requesterName },

        );

        await this.create(

          target.userId,

          NotificationType.SWAP,

          msg.title,

          msg.body,

          { swapId: swap.id, action },

        );

      }



      if (action === 'accepted' || action === 'rejected') {

        const locale = await this.userLocale(requester.userId);

        const bodyKey =

          action === 'accepted'

            ? 'NOTIFICATION_SWAP_ACCEPTED_BODY'

            : 'NOTIFICATION_SWAP_REJECTED_BODY';

        const msg = this.i18n.notification(

          locale,

          'NOTIFICATION_SWAP_TITLE',

          bodyKey,

          { memberName: targetName },

        );

        await this.create(

          requester.userId,

          NotificationType.SWAP,

          msg.title,

          msg.body,

          { swapId: swap.id, action },

        );

      }



      if (action === 'approved') {

        const locale = await this.userLocale(requester.userId);

        const msg = this.i18n.notification(

          locale,

          'NOTIFICATION_SWAP_TITLE',

          'NOTIFICATION_SWAP_APPROVED_BODY',

          { memberName: targetName },

        );

        await this.create(

          requester.userId,

          NotificationType.SWAP,

          msg.title,

          msg.body,

          { swapId: swap.id, action },

        );

      }

    }



    if (action === 'finalized' && requester) {

      const locale = await this.userLocale(requester.userId);

      const msg = this.i18n.notification(

        locale,

        'NOTIFICATION_SWAP_TITLE',

        'NOTIFICATION_SWAP_FINALIZED_BODY',

        { eventName },

      );

      await this.create(

        requester.userId,

        NotificationType.SWAP,

        msg.title,

        msg.body,

        { swapId: swap.id, action },

      );

    }

  }

  async notifySwapPendingLeader(swap: Swap) {
    const recipients = await this.protocolOversightUserIds('TEAM_HEAD');
    for (const userId of recipients) {
      const locale = await this.userLocale(userId);
      const event = await this.prisma.event.findUnique({
        where: { id: swap.eventId },
        select: { title: true },
      });
      const msg = this.i18n.notification(
        locale,
        'NOTIFICATION_SWAP_PENDING_LEADER_TITLE',
        'NOTIFICATION_SWAP_PENDING_LEADER_BODY',
        { eventName: event?.title ?? '' },
      );
      await this.create(userId, NotificationType.SWAP, msg.title, msg.body, {
        swapId: swap.id,
        eventId: swap.eventId,
      });
    }
  }

  async notifyReplacement(
    record: Replacement & {
      absentMember?: { firstName: string; lastName: string; userId: string };
      coverMember?: { firstName: string; lastName: string; userId: string } | null;
      event?: { title: string };
    },
    action: string,
  ) {
    const eventName =
      record.event?.title ??
      (
        await this.prisma.event.findUnique({
          where: { id: record.eventId },
          select: { title: true },
        })
      )?.title ??
      '';

    const absent =
      record.absentMember ??
      (await this.prisma.member.findUnique({ where: { id: record.absentMemberId } }));
    if (!absent) return;

    const absentName = this.memberDisplayName(absent);
    const coverName = record.coverMember
      ? this.memberDisplayName(record.coverMember)
      : '';

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
    if (action === 'requested' || action === 'rejected' || action === 'approved' || action === 'finalized') {
      recipientUserIds.add(absent.userId);
    }
    if (record.coverMember?.userId && (action === 'cover_assigned' || action === 'approved' || action === 'finalized')) {
      recipientUserIds.add(record.coverMember.userId);
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
        { memberName: coverName || absentName, eventName },
      );
      await this.create(userId, NotificationType.SWAP, msg.title, msg.body, {
        replacementId: record.id,
        eventId: record.eventId,
        action,
      });
    }
  }

  async notifyReplacementPendingLeader(
    record: Replacement & { event?: { title: string } },
  ) {
    const recipients = await this.protocolOversightUserIds('TEAM_HEAD');
    const eventName =
      record.event?.title ??
      (
        await this.prisma.event.findUnique({
          where: { id: record.eventId },
          select: { title: true },
        })
      )?.title ??
      '';
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
        eventId: record.eventId,
      });
    }
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
    eventId: string;
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
        eventId: params.eventId,
        status: params.status,
      });
    }
  }



  async notifyAttendanceAbsenceRisk(record: Attendance) {
    const teamHeadUserId = await this.findProtocolTeamHeadUserId(record.memberId);
    if (!teamHeadUserId) return;

    const [event] = await Promise.all([
      this.prisma.event.findUnique({
        where: { id: record.eventId },
        select: { title: true },
      }),
    ]);

    const locale = await this.userLocale(teamHeadUserId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_ATTENDANCE_ABSENCE_TITLE',
      'NOTIFICATION_ATTENDANCE_ABSENCE_BODY',
      { eventName: event?.title ?? '' },
    );

    await this.create(teamHeadUserId, NotificationType.ATTENDANCE, msg.title, msg.body, {
      attendanceId: record.id,
      eventId: record.eventId,
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

  async notifyAttendanceUpdate(record: Attendance) {

    const [member, event] = await Promise.all([

      this.prisma.member.findUnique({ where: { id: record.memberId } }),

      this.prisma.event.findUnique({

        where: { id: record.eventId },

        select: { title: true },

      }),

    ]);

    if (!member) return;



    const locale = await this.userLocale(member.userId);

    const msg = this.i18n.notification(

      locale,

      'NOTIFICATION_ATTENDANCE_TITLE',

      'NOTIFICATION_ATTENDANCE_BODY',

      { eventName: event?.title ?? '' },

    );

    await this.create(

      member.userId,

      NotificationType.ATTENDANCE,

      msg.title,

      msg.body,

      {

        attendanceId: record.id,

        eventId: record.eventId,

        status: record.physicalStatus,

      },

    );

  }

  async notifyExcusedReview(record: Attendance, approved: boolean) {
    const [member, event] = await Promise.all([
      this.prisma.member.findUnique({ where: { id: record.memberId } }),
      this.prisma.event.findUnique({
        where: { id: record.eventId },
        select: { title: true },
      }),
    ]);
    if (!member) return;

    const locale = await this.userLocale(member.userId);
    const msg = this.i18n.notification(
      locale,
      'NOTIFICATION_EXCUSED_REVIEW_TITLE',
      approved
        ? 'NOTIFICATION_EXCUSED_APPROVED_BODY'
        : 'NOTIFICATION_EXCUSED_REJECTED_BODY',
      { eventName: event?.title ?? '' },
    );

    await this.create(member.userId, NotificationType.ATTENDANCE, msg.title, msg.body, {
      attendanceId: record.id,
      eventId: record.eventId,
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



  async listForUser(userId: string, page = 1, limit = 20, unreadOnly = false) {

    const { skip, take } = { skip: (page - 1) * limit, take: limit };

    const where = { userId, ...(unreadOnly ? { read: false } : {}) };

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

  /** Sprint F hook — in-app notice only; thank-you workflow deferred. */
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

