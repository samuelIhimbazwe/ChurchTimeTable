import { Injectable } from '@nestjs/common';

import {

  Attendance,

  DisciplineCase,

  EventAssignment,

  NotificationType,

  Prisma,

  Swap,

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

  }): string {

    return `${member.firstName} ${member.lastName}`.trim();

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

}

