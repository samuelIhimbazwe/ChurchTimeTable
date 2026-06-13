import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AnnouncementAudience,
  FamilyMemberRole,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { IndividualWhatsAppService } from '../messaging/individual-whatsapp.service';
import { AppLinkService } from '../messaging/app-link.service';
import { PERMISSIONS } from '../common/constants/roles';
import { assertChoirOpsManage, assertChoirOpsView } from './choir-operations.util';

@Injectable()
export class ChoirAnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
    private audit: AuditService,
    private notifications: NotificationsService,
    private individualWhatsApp: IndividualWhatsAppService,
    private appLinks: AppLinkService,
  ) {}

  async listMusicNotifyDelivery(userId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(
      resolved.permissions,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    );

    const rows = await this.prisma.choirAnnouncement.findMany({
      where: {
        choirId,
        title: { startsWith: 'Music —' },
        publishedAt: { not: null },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 30,
    });

    const items = await Promise.all(
      rows.map(async (row) => {
        const [deliveredCount, readCount, acknowledgedCount] = await Promise.all([
          this.prisma.choirMembership.count({
            where: { choirId, isActive: true },
          }),
          this.prisma.choirAnnouncementRead.count({
            where: { announcementId: row.id },
          }),
          this.prisma.choirAnnouncementRead.count({
            where: { announcementId: row.id, acknowledged: true },
          }),
        ]);
        const audienceSize = deliveredCount > 0 ? deliveredCount : readCount;
        const deliveryRate =
          audienceSize > 0 ? Math.round((readCount / audienceSize) * 100) : null;

        return {
          id: row.id,
          title: row.title,
          publishedAt: row.publishedAt?.toISOString() ?? null,
          audience: row.audience,
          deliveredCount,
          readCount,
          acknowledgedCount,
          audienceSize,
          deliveryRate,
        };
      }),
    );

    return { items };
  }

  private async assertManage(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsManage(
      resolved.permissions,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    );
    return resolved;
  }

  async list(userId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    assertChoirOpsView(
      resolved.permissions,
      PERMISSIONS.CHOIR_ANNOUNCEMENT_MANAGE,
    );

    return this.prisma.choirAnnouncement.findMany({
      where: { choirId },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async create(
    userId: string,
    dto: {
      choirId: string;
      title: string;
      body: string;
      audience?: AnnouncementAudience;
      audienceRef?: string;
      expiresAt?: string;
      publish?: boolean;
    },
  ) {
    await this.assertManage(userId);
    if (!dto.title?.trim() || !dto.body?.trim()) {
      throw new BadRequestException('Title and body are required');
    }

    const audience = dto.audience ?? AnnouncementAudience.ENTIRE_CHOIR;
    this.validateAudienceRef(audience, dto.audienceRef);

    const row = await this.prisma.choirAnnouncement.create({
      data: {
        choirId: dto.choirId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        audience,
        audienceRef: dto.audienceRef ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        publishedAt: dto.publish ? new Date() : null,
        createdByUserId: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'CHOIR_ANNOUNCEMENT_CREATED',
      entity: 'ChoirAnnouncement',
      entityId: row.id,
      newValue: { choirId: dto.choirId, title: row.title, audience },
    });

    if (dto.publish) {
      await this.notifyAudience(row);
    }

    return row;
  }

  async publish(userId: string, id: string) {
    await this.assertManage(userId);
    const existing = await this.prisma.choirAnnouncement.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Announcement not found');
    if (existing.publishedAt) return existing;

    const row = await this.prisma.choirAnnouncement.update({
      where: { id },
      data: { publishedAt: new Date() },
    });

    await this.audit.log({
      userId,
      action: 'CHOIR_ANNOUNCEMENT_PUBLISHED',
      entity: 'ChoirAnnouncement',
      entityId: id,
      newValue: { title: row.title },
    });

    await this.notifyAudience(row);
    return row;
  }

  private validateAudienceRef(
    audience: AnnouncementAudience,
    audienceRef?: string,
  ) {
    const needsRef = new Set<AnnouncementAudience>([
      AnnouncementAudience.FAMILIES,
      AnnouncementAudience.VOICE_SECTION,
      AnnouncementAudience.CUSTOM_GROUP,
    ]);
    if (needsRef.has(audience) && !audienceRef?.trim()) {
      throw new BadRequestException(
        `audienceRef is required for audience ${audience}`,
      );
    }
  }

  private async notifyAudience(row: {
    id: string;
    choirId: string | null;
    title: string;
    body: string;
    audience: AnnouncementAudience;
    audienceRef: string | null;
  }) {
    if (!row.choirId) return;
    const userIds = await this.resolveAudienceUserIds(
      row.choirId,
      row.audience,
      row.audienceRef,
    );
    const preview = row.body.slice(0, 200);
    const actionUrl = this.appLinks.choirAnnouncement(row.choirId, row.id);
    for (const targetUserId of userIds) {
      await this.notifications.create(
        targetUserId,
        NotificationType.GENERAL,
        row.title,
        preview,
        {
          kind: 'choir_announcement',
          announcementId: row.id,
          choirId: row.choirId,
          audience: row.audience,
          actionUrl,
        },
        row.choirId,
      );

      void this.individualWhatsApp
        .sendAnnouncement({
          userId: targetUserId,
          title: row.title,
          preview,
          choirId: row.choirId,
          announcementId: row.id,
        })
        .catch(() => undefined);
    }
  }

  private async resolveAudienceUserIds(
    choirId: string,
    audience: AnnouncementAudience,
    audienceRef: string | null,
  ): Promise<string[]> {
    const choirMemberUserIds = async () => {
      const rows = await this.prisma.choirMembership.findMany({
        where: { choirId, isActive: true },
        select: { userId: true },
      });
      return [...new Set(rows.map((r) => r.userId))];
    };

    switch (audience) {
      case AnnouncementAudience.ENTIRE_CHOIR:
        return choirMemberUserIds();

      case AnnouncementAudience.FAMILIES: {
        const familyWhere: Prisma.FamilyMemberWhereInput = audienceRef
          ? { familyId: audienceRef }
          : { family: { choirId } };
        const members = await this.prisma.familyMember.findMany({
          where: familyWhere,
          select: { member: { select: { userId: true } } },
        });
        return [
          ...new Set(
            members.map((m) => m.member.userId).filter(Boolean) as string[],
          ),
        ];
      }

      case AnnouncementAudience.LEADERSHIP: {
        const committee = await this.prisma.choirCommitteeMember.findMany({
          where: { choirId },
          select: { member: { select: { userId: true } } },
        });
        const familyHeads = await this.prisma.familyMember.findMany({
          where: {
            role: FamilyMemberRole.HEAD,
            family: { choirId },
          },
          select: { member: { select: { userId: true } } },
        });
        return [
          ...new Set(
            [...committee, ...familyHeads]
              .map((r) => r.member.userId)
              .filter(Boolean) as string[],
          ),
        ];
      }

      case AnnouncementAudience.VOICE_SECTION: {
        // Voice-section membership is not modeled yet; notify active choir members.
        return choirMemberUserIds();
      }

      case AnnouncementAudience.CUSTOM_GROUP: {
        if (!audienceRef) return [];
        if (audienceRef.includes(',')) {
          return audienceRef.split(',').map((s) => s.trim()).filter(Boolean);
        }
        const members = await this.prisma.familyMember.findMany({
          where: { familyId: audienceRef },
          select: { member: { select: { userId: true } } },
        });
        return [
          ...new Set(
            members.map((m) => m.member.userId).filter(Boolean) as string[],
          ),
        ];
      }

      default:
        throw new ForbiddenException('Unsupported audience');
    }
  }
}
