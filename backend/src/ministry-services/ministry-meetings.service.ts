import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { hasGlobalMinistryManage } from '../ministries/ministry-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { MinistryActivityService } from './ministry-activity.service';
import { MINISTRY_SERVICES_AUDIT, MINISTRY_ACTIVITY_ENTITY } from './ministry-services.constants';
import {
  assertMinistryServicesAccess,
  assertMinistrySetting,
  notifyMinistryMembers,
} from './ministry-services.util';

@Injectable()
export class MinistryMeetingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private access: MinistryAccessService,
    private activity: MinistryActivityService,
    private notifications: NotificationsService,
  ) {}

  async list(actorUserId: string, ministryId: string) {
    await assertMinistryServicesAccess(this.access, actorUserId, ministryId);
    return this.prisma.ministryMeeting.findMany({
      where: { ministryId },
      orderBy: { scheduledAt: 'desc' },
      include: {
        _count: {
          select: { attendees: true, actionItems: true, decisions: true },
        },
      },
    });
  }

  async get(actorUserId: string, id: string) {
    const meeting = await this.prisma.ministryMeeting.findUnique({
      where: { id },
      include: {
        attendees: { include: { member: { select: { id: true, firstName: true, lastName: true } } } },
        decisions: true,
        actionItems: {
          include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    await assertMinistryServicesAccess(this.access, actorUserId, meeting.ministryId);
    return meeting;
  }

  async create(
    actorUserId: string,
    dto: {
      ministryId: string;
      title: string;
      description?: string;
      scheduledAt: string;
      location?: string;
    },
  ) {
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryManage(actor.permissions)) {
      throw new ForbiddenException('Meeting creation denied');
    }
    await assertMinistrySetting(this.prisma, dto.ministryId, 'allowMeetings');

    const meeting = await this.prisma.ministryMeeting.create({
      data: {
        ministryId: dto.ministryId,
        title: dto.title.trim(),
        description: dto.description,
        scheduledAt: new Date(dto.scheduledAt),
        location: dto.location,
        createdByUserId: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.MEETING_CREATED,
      entity: MINISTRY_ACTIVITY_ENTITY.MEETING,
      entityId: meeting.id,
      newValue: { title: meeting.title },
    });
    await this.activity.record({
      ministryId: dto.ministryId,
      type: 'MEETING_CREATED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.MEETING,
      entityId: meeting.id,
      summary: meeting.title,
    });
    await notifyMinistryMembers(
      this.prisma,
      this.notifications,
      dto.ministryId,
      NotificationType.MINISTRY_MEETING,
      'Ministry meeting scheduled',
      meeting.title,
      { meetingId: meeting.id, ministryId: dto.ministryId },
    );

    return meeting;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: Partial<{
      title: string;
      description: string;
      scheduledAt: string;
      location: string;
      status: string;
    }>,
  ) {
    const existing = await this.get(actorUserId, id);
    const actor = await this.access.resolveActor(actorUserId);
    if (!hasGlobalMinistryManage(actor.permissions)) {
      throw new ForbiddenException('Meeting update denied');
    }

    const meeting = await this.prisma.ministryMeeting.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        location: dto.location,
        status: dto.status as never,
      },
    });

    if (dto.status === 'COMPLETED') {
      await this.audit.log({
        userId: actorUserId,
        action: MINISTRY_SERVICES_AUDIT.MEETING_COMPLETED,
        entity: MINISTRY_ACTIVITY_ENTITY.MEETING,
        entityId: id,
      });
      await this.activity.record({
        ministryId: existing.ministryId,
        type: 'MEETING_COMPLETED',
        actorUserId,
        entityType: MINISTRY_ACTIVITY_ENTITY.MEETING,
        entityId: id,
        summary: meeting.title,
      });
    }

    return meeting;
  }

  async recordAttendee(
    actorUserId: string,
    meetingId: string,
    memberId: string,
    present: boolean,
  ) {
    await this.get(actorUserId, meetingId);
    return this.prisma.ministryMeetingAttendee.upsert({
      where: { meetingId_memberId: { meetingId, memberId } },
      create: { meetingId, memberId, present },
      update: { present },
    });
  }

  async addDecision(actorUserId: string, meetingId: string, summary: string) {
    await this.get(actorUserId, meetingId);
    return this.prisma.ministryMeetingDecision.create({
      data: { meetingId, summary },
    });
  }

  async addActionItem(
    actorUserId: string,
    meetingId: string,
    dto: { title: string; assigneeId?: string; dueDate?: string },
  ) {
    const meeting = await this.get(actorUserId, meetingId);
    const item = await this.prisma.ministryMeetingActionItem.create({
      data: {
        meetingId,
        title: dto.title.trim(),
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.ACTION_ITEM_CREATED,
      entity: MINISTRY_ACTIVITY_ENTITY.ACTION_ITEM,
      entityId: item.id,
    });
    await this.activity.record({
      ministryId: meeting.ministryId,
      type: 'ACTION_ITEM_CREATED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.ACTION_ITEM,
      entityId: item.id,
      summary: item.title,
    });

    if (dto.assigneeId) {
      const member = await this.prisma.member.findUnique({
        where: { id: dto.assigneeId },
        select: { userId: true },
      });
      if (member) {
        await this.notifications.create(
          member.userId,
          NotificationType.MINISTRY_ACTION_ITEM,
          'Ministry action item assigned',
          item.title,
          { actionItemId: item.id, meetingId, ministryId: meeting.ministryId },
          undefined,
          meeting.ministryId,
        );
      }
    }

    return item;
  }

  async completeActionItem(actorUserId: string, itemId: string) {
    const item = await this.prisma.ministryMeetingActionItem.findUnique({
      where: { id: itemId },
      include: { meeting: true },
    });
    if (!item) throw new NotFoundException('Action item not found');
    await this.get(actorUserId, item.meetingId);

    const updated = await this.prisma.ministryMeetingActionItem.update({
      where: { id: itemId },
      data: { status: 'DONE' },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.ACTION_ITEM_COMPLETED,
      entity: MINISTRY_ACTIVITY_ENTITY.ACTION_ITEM,
      entityId: itemId,
    });
    await this.activity.record({
      ministryId: item.meeting.ministryId,
      type: 'ACTION_ITEM_COMPLETED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.ACTION_ITEM,
      entityId: itemId,
      summary: item.title,
    });

    return updated;
  }
}
