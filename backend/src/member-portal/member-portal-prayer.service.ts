import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';

const INTERCESSORS_CODE = 'INTERCESSORS';

@Injectable()
export class MemberPortalPrayerService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  private async intercessorsMinistryId() {
    const ministry = await this.prisma.ministry.findUnique({
      where: { code: INTERCESSORS_CODE },
    });
    if (!ministry) {
      throw new NotFoundException('Intercessors ministry is not configured');
    }
    return ministry.id;
  }

  async submitRequest(
    userId: string,
    body: { content: string; shareIdentity?: boolean; displayName?: string },
  ) {
    const content = body.content?.trim();
    if (!content || content.length < 3) {
      throw new BadRequestException('Prayer request is too short');
    }
    if (content.length > 4000) {
      throw new BadRequestException('Prayer request is too long');
    }

    const member = await this.prisma.member.findUnique({ where: { userId } });
    const ministryId = await this.intercessorsMinistryId();
    const shareIdentity = body.shareIdentity === true;
    const displayName =
      shareIdentity && body.displayName?.trim()
        ? body.displayName.trim().slice(0, 120)
        : null;

    return this.prisma.prayerRequest.create({
      data: {
        content,
        isAnonymous: !shareIdentity,
        displayName,
        memberId: member?.id,
        userId,
        ministryId,
      },
      select: {
        id: true,
        createdAt: true,
        isAnonymous: true,
      },
    });
  }

  /** Intercessor ministry inbox — identity hidden unless submitter opted in */
  async listForIntercessors(actorUserId: string) {
    await this.assertIntercessorAccess(actorUserId);
    const ministryId = await this.intercessorsMinistryId();

    const rows = await this.prisma.prayerRequest.findMany({
      where: { ministryId, status: { in: ['PENDING', 'IN_PRAYER'] } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        content: true,
        displayName: true,
        isAnonymous: true,
        status: true,
        createdAt: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      status: r.status,
      createdAt: r.createdAt,
      from: r.isAnonymous ? 'Anonymous' : (r.displayName ?? 'Anonymous'),
    }));
  }

  async updateRequestStatus(
    actorUserId: string,
    requestId: string,
    status: 'IN_PRAYER' | 'COMPLETED',
  ) {
    await this.assertIntercessorAccess(actorUserId);
    const ministryId = await this.intercessorsMinistryId();
    const existing = await this.prisma.prayerRequest.findFirst({
      where: { id: requestId, ministryId },
    });
    if (!existing) throw new NotFoundException('Prayer request not found');
    return this.prisma.prayerRequest.update({
      where: { id: requestId },
      data: { status },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  private async assertIntercessorAccess(userId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    const allowed =
      hasEffectivePermission(resolved.permissions, PERMISSIONS.MINISTRY_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.MINISTRY_VIEW) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_INTERCESSION_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_DEVOTION_MANAGE) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.ADMIN_USERS_MANAGE);
    if (!allowed) {
      throw new ForbiddenException('Intercessor ministry access denied');
    }
  }
}
