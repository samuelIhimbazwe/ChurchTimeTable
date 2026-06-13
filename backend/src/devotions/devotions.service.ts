import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DevotionType, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IndividualWhatsAppService } from '../messaging/individual-whatsapp.service';
import { AppLinkService } from '../messaging/app-link.service';
import { getActiveChoirId, choirScopeFilter } from '../common/choir/choir-context.storage';
import type { CreateDevotionDto, UpdateDevotionDto } from './dto/devotion.dto';

@Injectable()
export class DevotionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private individualWhatsApp: IndividualWhatsAppService,
    private appLinks: AppLinkService,
  ) {}

  private publishedFilter(now = new Date()): Prisma.DevotionWhereInput {
    return {
      publishedAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
  }

  async list(
    choirId: string,
    filters?: { type?: DevotionType; pinned?: boolean },
  ) {
    return this.prisma.devotion.findMany({
      where: {
        choirId,
        ...this.publishedFilter(),
        ...(filters?.type ? { type: filters.type } : {}),
        ...(filters?.pinned !== undefined ? { isPinned: filters.pinned } : {}),
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });
  }

  async listAllForManage(choirId: string) {
    return this.prisma.devotion.findMany({
      where: { choirId },
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });
  }

  async widgetFeed(choirId: string) {
    const now = new Date();
    const base = {
      choirId,
      ...this.publishedFilter(now),
    };

    const [pinned, verseOfDay, encouragement] = await Promise.all([
      this.prisma.devotion.findFirst({
        where: { ...base, isPinned: true },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.devotion.findFirst({
        where: { ...base, type: DevotionType.VERSE_OF_DAY, isPinned: false },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.devotion.findFirst({
        where: { ...base, type: DevotionType.ENCOURAGEMENT, isPinned: false },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    return { pinned, verseOfDay, encouragement };
  }

  async getById(choirId: string, id: string) {
    const row = await this.prisma.devotion.findFirst({
      where: { id, choirId },
    });
    if (!row) {
      throw new NotFoundException('Devotion not found');
    }
    return row;
  }

  async create(userId: string, choirId: string, dto: CreateDevotionDto) {
    const row = await this.prisma.devotion.create({
      data: {
        choirId,
        title: dto.title,
        content: dto.content,
        verseReference: dto.verseReference,
        verseText: dto.verseText,
        type: dto.type,
        isPinned: dto.isPinned ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        prayerDate: dto.prayerDate ? new Date(dto.prayerDate) : null,
        createdById: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'devotion.create',
      entity: 'Devotion',
      entityId: row.id,
      newValue: { choirId, title: row.title, type: row.type },
    });

    return row;
  }

  async update(
    userId: string,
    choirId: string,
    id: string,
    dto: UpdateDevotionDto,
  ) {
    await this.getById(choirId, id);
    const row = await this.prisma.devotion.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.verseReference !== undefined
          ? { verseReference: dto.verseReference }
          : {}),
        ...(dto.verseText !== undefined ? { verseText: dto.verseText } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
      },
    });

    await this.audit.log({
      userId,
      action: 'devotion.update',
      entity: 'Devotion',
      entityId: id,
      newValue: dto as Prisma.InputJsonValue,
    });

    return row;
  }

  async publish(userId: string, choirId: string, id: string) {
    const existing = await this.getById(choirId, id);
    if (existing.publishedAt) {
      throw new BadRequestException('Already published');
    }

    const now = new Date();

    const row = await this.prisma.$transaction(async (tx) => {
      if (existing.isPinned) {
        await tx.devotion.updateMany({
          where: { choirId, isPinned: true, id: { not: id } },
          data: { isPinned: false },
        });
      }

      return tx.devotion.update({
        where: { id },
        data: { publishedAt: now },
      });
    });

    await this.audit.log({
      userId,
      action: 'devotion.publish',
      entity: 'Devotion',
      entityId: id,
      newValue: { publishedAt: now.toISOString() },
    });

    await this.notifyMembersIfAllowed(choirId, row);

    return row;
  }

  async pin(userId: string, choirId: string, id: string) {
    await this.getById(choirId, id);

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.devotion.updateMany({
        where: { choirId, isPinned: true },
        data: { isPinned: false },
      });
      return tx.devotion.update({
        where: { id },
        data: { isPinned: true },
      });
    });

    await this.audit.log({
      userId,
      action: 'devotion.pin',
      entity: 'Devotion',
      entityId: id,
    });

    return row;
  }

  private async notifyMembersIfAllowed(
    choirId: string,
    devotion: {
      id: string;
      title: string;
      type: DevotionType;
      verseReference: string | null;
      verseText: string | null;
    },
  ) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await this.prisma.notification.count({
      where: {
        choirId,
        type: NotificationType.CHOIR_DEVOTION,
        createdAt: { gte: startOfDay },
      },
    });

    if (sentToday >= 1) {
      return;
    }

    const memberships = await this.prisma.choirMembership.findMany({
      where: { choirId, isActive: true },
      select: { userId: true },
    });

    const userIds =
      memberships.length > 0
        ? memberships.map((m) => m.userId)
        : (
            await this.prisma.user.findMany({
              where: {
                member: { ministry: { in: ['CHOIR', 'BOTH'] } },
                isActive: true,
              },
              select: { id: true },
            })
          ).map((u) => u.id);

    const actionUrl = this.appLinks.portalDevotion();
    const preview =
      devotion.type === DevotionType.VERSE_OF_DAY && devotion.verseText
        ? devotion.verseText.slice(0, 200)
        : 'A new devotion has been published for your choir.';

    for (const userId of userIds) {
      await this.notifications.create(
        userId,
        NotificationType.CHOIR_DEVOTION,
        devotion.title,
        preview,
        {
          devotionId: devotion.id,
          choirId,
          kind: 'choir_devotion',
          actionUrl,
        },
        choirId,
      );

      if (devotion.type === DevotionType.VERSE_OF_DAY) {
        void this.individualWhatsApp
          .sendVerseOfDay({
            userId,
            title: devotion.title,
            verseReference: devotion.verseReference,
            verseText: devotion.verseText,
            choirId,
            devotionId: devotion.id,
          })
          .catch(() => undefined);
      }
    }
  }

  async bookmark(userId: string, choirId: string, devotionId: string) {
    await this.getById(choirId, devotionId);
    return this.prisma.devotionBookmark.upsert({
      where: { userId_devotionId: { userId, devotionId } },
      create: { userId, devotionId },
      update: {},
    });
  }

  async removeBookmark(userId: string, devotionId: string) {
    await this.prisma.devotionBookmark.deleteMany({
      where: { userId, devotionId },
    });
    return { ok: true };
  }

  async listBookmarks(userId: string, choirId: string) {
    return this.prisma.devotionBookmark.findMany({
      where: {
        userId,
        devotion: { choirId },
      },
      include: { devotion: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  assertChoirAccess(choirId: string) {
    const active = getActiveChoirId();
    if (choirId !== active) {
      throw new ForbiddenException('Choir context mismatch');
    }
  }

  async listForMinistry(ministryId: string) {
    const now = new Date();
    return this.prisma.devotion.findMany({
      where: {
        ministryId,
        ...this.publishedFilter(now),
      },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  async createForMinistry(
    userId: string,
    ministryId: string,
    dto: CreateDevotionDto & {
      ministryId?: string;
      operationalUnitId?: string;
      visibilityScope?: string;
    },
  ) {
    const settings = await this.prisma.ministrySettings.findUnique({
      where: { ministryId },
    });
    if (settings && !settings.allowDevotions) {
      throw new ForbiddenException('Devotions disabled for this ministry');
    }

    const row = await this.prisma.devotion.create({
      data: {
        ministryId,
        operationalUnitId: dto.operationalUnitId ?? null,
        visibilityScope: (dto.visibilityScope as never) ?? 'MINISTRY',
        choirId: null,
        title: dto.title,
        content: dto.content,
        verseReference: dto.verseReference,
        verseText: dto.verseText,
        type: dto.type,
        isPinned: dto.isPinned ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdById: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'MINISTRY_DEVOTION_PUBLISHED',
      entity: 'Devotion',
      entityId: row.id,
      newValue: { ministryId, title: row.title },
    });

    return row;
  }

  async publishMinistryDevotion(userId: string, ministryId: string, id: string) {
    const row = await this.prisma.devotion.findFirst({
      where: { id, ministryId },
    });
    if (!row) throw new NotFoundException('Devotion not found');
    const updated = await this.prisma.devotion.update({
      where: { id },
      data: { publishedAt: new Date() },
    });

    const memberships = await this.prisma.ministryMembership.findMany({
      where: { ministryId, status: 'ACTIVE' },
      include: { member: { select: { userId: true } } },
    });
    for (const m of memberships) {
      await this.notifications.create(
        m.member.userId,
        NotificationType.MINISTRY_DEVOTION,
        updated.title,
        'A new ministry devotion has been published.',
        { devotionId: id, ministryId },
        undefined,
        ministryId,
      );
    }

    return updated;
  }
}
