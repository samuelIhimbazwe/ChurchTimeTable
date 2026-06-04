import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { canManageMinistryMembers, hasGlobalMinistryManage } from '../ministries/ministry-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { MinistryActivityService } from './ministry-activity.service';
import { MINISTRY_SERVICES_AUDIT, MINISTRY_ACTIVITY_ENTITY } from './ministry-services.constants';
import {
  assertMinistryServicesAccess,
  assertMinistrySetting,
  getMinistryOrThrow,
  notifyMinistryMembers,
  publishedAnnouncementFilter,
} from './ministry-services.util';

@Injectable()
export class MinistryAnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private access: MinistryAccessService,
    private activity: MinistryActivityService,
    private notifications: NotificationsService,
  ) {}

  private async assertManage(actorUserId: string, ministryId: string) {
    const actor = await this.access.resolveActor(actorUserId);
    if (hasGlobalMinistryManage(actor.permissions)) return;
    if (
      canManageMinistryMembers(actor.permissions, actor.ministryScoped, ministryId) ||
      actor.permissions.includes('ministry.leadership.manage')
    ) {
      return;
    }
    throw new ForbiddenException('Announcement management denied');
  }

  async listByMinistry(actorUserId: string, ministryId: string) {
    await assertMinistryServicesAccess(this.access, actorUserId, ministryId);
    const actor = await this.access.resolveActor(actorUserId);
    const isLeader = hasGlobalMinistryManage(actor.permissions);

    return this.prisma.ministryAnnouncement.findMany({
      where: {
        ministryId,
        isActive: true,
        ...(isLeader ? {} : publishedAnnouncementFilter()),
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      include: { createdBy: { select: { id: true, email: true } } },
    });
  }

  async getById(actorUserId: string, id: string) {
    const row = await this.prisma.ministryAnnouncement.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, email: true } } },
    });
    if (!row) throw new NotFoundException('Announcement not found');
    await assertMinistryServicesAccess(this.access, actorUserId, row.ministryId);
    return row;
  }

  async create(
    actorUserId: string,
    dto: {
      ministryId: string;
      title: string;
      content: string;
      priority?: string;
      audienceType?: string;
      audienceRef?: string;
      expiresAt?: string;
    },
  ) {
    await this.assertManage(actorUserId, dto.ministryId);
    await assertMinistrySetting(this.prisma, dto.ministryId, 'allowAnnouncements');
    await getMinistryOrThrow(this.prisma, dto.ministryId);

    const announcement = await this.prisma.ministryAnnouncement.create({
      data: {
        ministryId: dto.ministryId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        priority: (dto.priority as never) ?? 'NORMAL',
        audienceType: (dto.audienceType as never) ?? 'ALL_MINISTRY',
        audienceRef: dto.audienceRef,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdByUserId: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MINISTRY_SERVICES_AUDIT.ANNOUNCEMENT_CREATED,
      entity: MINISTRY_ACTIVITY_ENTITY.ANNOUNCEMENT,
      entityId: announcement.id,
      newValue: { ministryId: dto.ministryId, title: announcement.title },
    });
    await this.activity.record({
      ministryId: dto.ministryId,
      type: 'ANNOUNCEMENT_CREATED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.ANNOUNCEMENT,
      entityId: announcement.id,
      summary: announcement.title,
    });

    return announcement;
  }

  async update(
    actorUserId: string,
    id: string,
    dto: Partial<{
      title: string;
      content: string;
      priority: string;
      audienceType: string;
      expiresAt: string | null;
      isActive: boolean;
    }>,
  ) {
    const existing = await this.getById(actorUserId, id);
    await this.assertManage(actorUserId, existing.ministryId);

    return this.prisma.ministryAnnouncement.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        priority: dto.priority as never,
        audienceType: dto.audienceType as never,
        expiresAt:
          dto.expiresAt === null ? null : dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(actorUserId: string, id: string) {
    const existing = await this.getById(actorUserId, id);
    await this.assertManage(actorUserId, existing.ministryId);
    return this.update(actorUserId, id, { isActive: false });
  }

  async publish(actorUserId: string, id: string) {
    const existing = await this.getById(actorUserId, id);
    await this.assertManage(actorUserId, existing.ministryId);

    const published = await this.prisma.ministryAnnouncement.update({
      where: { id },
      data: { publishedAt: new Date() },
    });

    await this.activity.record({
      ministryId: existing.ministryId,
      type: 'ANNOUNCEMENT_PUBLISHED',
      actorUserId,
      entityType: MINISTRY_ACTIVITY_ENTITY.ANNOUNCEMENT,
      entityId: id,
      summary: published.title,
    });

    await notifyMinistryMembers(
      this.prisma,
      this.notifications,
      existing.ministryId,
      NotificationType.MINISTRY_ANNOUNCEMENT,
      published.title,
      published.content.slice(0, 200),
      { announcementId: id, ministryId: existing.ministryId },
    );

    return published;
  }

  async pin(actorUserId: string, id: string) {
    const existing = await this.getById(actorUserId, id);
    await this.assertManage(actorUserId, existing.ministryId);

    await this.prisma.ministryAnnouncement.updateMany({
      where: { ministryId: existing.ministryId, isPinned: true },
      data: { isPinned: false },
    });

    return this.prisma.ministryAnnouncement.update({
      where: { id },
      data: { isPinned: true },
    });
  }

  async markRead(actorUserId: string, id: string) {
    const existing = await this.getById(actorUserId, id);
    const actor = await this.access.resolveActor(actorUserId);
    if (!actor.memberId) throw new ForbiddenException('Member profile required');

    return this.prisma.ministryAnnouncementRead.upsert({
      where: {
        announcementId_memberId: {
          announcementId: id,
          memberId: actor.memberId,
        },
      },
      create: { announcementId: id, memberId: actor.memberId },
      update: { readAt: new Date() },
    });
  }
}
