import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinistryAccessService } from '../ministries/ministry-access.service';
import { hasGlobalMinistryManage } from '../ministries/ministry-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

export async function assertMinistryServicesAccess(
  access: MinistryAccessService,
  actorUserId: string,
  ministryId: string,
) {
  const visible = await access.ministryIdsVisibleTo(actorUserId);
  if (visible !== null && !visible.includes(ministryId)) {
    throw new ForbiddenException('Ministry access denied');
  }
  const actor = await access.resolveActor(actorUserId);
  if (visible === null && !hasGlobalMinistryManage(actor.permissions)) {
    const canView =
      actor.permissions.includes('ministry.view') ||
      actor.permissions.includes('ministry.member.view') ||
      actor.permissions.includes('ministry.reports.view');
    if (!canView) throw new ForbiddenException('Ministry access denied');
  }
}

export async function assertMinistrySetting(
  prisma: PrismaService,
  ministryId: string,
  flag: 'allowAnnouncements' | 'allowDocuments' | 'allowMeetings' | 'allowDevotions',
) {
  const settings = await prisma.ministrySettings.findUnique({ where: { ministryId } });
  if (settings && !settings[flag]) {
    throw new ForbiddenException(`Ministry setting ${flag} is disabled`);
  }
}

export async function getMinistryOrThrow(prisma: PrismaService, ministryId: string) {
  const ministry = await prisma.ministry.findUnique({ where: { id: ministryId } });
  if (!ministry) throw new NotFoundException('Ministry not found');
  return ministry;
}

export async function notifyMinistryMembers(
  prisma: PrismaService,
  notifications: NotificationsService,
  ministryId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const memberships = await prisma.ministryMembership.findMany({
    where: { ministryId, status: 'ACTIVE' },
    include: { member: { select: { userId: true } } },
  });
  const userIds = [...new Set(memberships.map((m) => m.member.userId))];
  await Promise.all(
    userIds.map((userId) =>
      notifications.create(userId, type, title, body, data, undefined, ministryId),
    ),
  );
}

export function publishedAnnouncementFilter(now = new Date()) {
  return {
    isActive: true,
    publishedAt: { lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}
