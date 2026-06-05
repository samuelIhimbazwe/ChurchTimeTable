import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChurchBroadcastType } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { MEMBER_PORTAL_AUDIT } from './member-portal.constants';
import { MemberPortalNotificationsService } from './member-portal-notifications.service';

@Injectable()
export class ChurchBroadcastsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private permissions: PermissionsResolver,
    private notify: MemberPortalNotificationsService,
  ) {}

  async list() {
    return this.prisma.churchBroadcast.findMany({
      orderBy: [{ isLive: 'desc' }, { startAt: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async listLive() {
    return this.prisma.churchBroadcast.findMany({
      where: { isLive: true },
      orderBy: { startAt: 'desc' },
    });
  }

  async create(
    actorUserId: string,
    data: {
      title: string;
      description?: string;
      youtubeUrl: string;
      thumbnail?: string;
      broadcastType?: ChurchBroadcastType;
      startAt?: string;
      endAt?: string;
      isLive?: boolean;
    },
  ) {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.MEMBER_MANAGE) &&
      !hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE)
    ) {
      throw new ForbiddenException('Denied');
    }

    const row = await this.prisma.churchBroadcast.create({
      data: {
        title: data.title,
        description: data.description,
        youtubeUrl: data.youtubeUrl,
        thumbnail: data.thumbnail,
        broadcastType: data.broadcastType ?? 'OTHER',
        startAt: data.startAt ? new Date(data.startAt) : undefined,
        endAt: data.endAt ? new Date(data.endAt) : undefined,
        isLive: data.isLive ?? false,
        publishedAt: new Date(),
        createdById: actorUserId,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      action: MEMBER_PORTAL_AUDIT.BROADCAST_CREATED,
      entity: 'ChurchBroadcast',
      entityId: row.id,
      newValue: data as Prisma.InputJsonValue,
    });

    const notifyPromise = this.notify.notifyBroadcastStarted({
      id: row.id,
      title: row.title,
      isLive: row.isLive,
    });
    if (process.env.CMMS_E2E === '1') {
      await notifyPromise;
    } else {
      void notifyPromise;
    }

    return row;
  }
}
