import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChoirMembershipRulesService } from './choir-membership-rules.service';

@Injectable()
export class ChoirDiscoveryService {
  constructor(
    private prisma: PrismaService,
    private choirRules: ChoirMembershipRulesService,
  ) {}

  async listPublic(actorUserId?: string) {
    let memberId: string | undefined;
    if (actorUserId) {
      const member = await this.prisma.member.findUnique({
        where: { userId: actorUserId },
        select: { id: true },
      });
      memberId = member?.id;
    }

    const choirs = await this.prisma.choir.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { memberships: { where: { isActive: true } } } },
        joinRequests: memberId
          ? {
              where: { memberId },
              orderBy: { createdAt: 'desc' },
              take: 1,
            }
          : false,
        sponsorRequests: memberId
          ? {
              where: { memberId },
              orderBy: { createdAt: 'desc' },
              take: 1,
            }
          : false,
        sponsorships: memberId
          ? { where: { memberId, active: true } }
          : false,
      },
    });

    const mapped = choirs.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      choirKind: c.choirKind,
      leader: c.leaderDisplayName,
      isPublicJoinable: c.isPublicJoinable,
      membershipCount: c.showMemberCountPublic ? c._count.memberships : undefined,
      showMemberCount: c.showMemberCountPublic,
      joinStatus: memberId ? (c.joinRequests[0]?.status ?? null) : null,
      pendingRequestId: memberId ? (c.joinRequests[0]?.id ?? null) : null,
      sponsorStatus: memberId
        ? (Array.isArray(c.sponsorRequests)
            ? (c.sponsorRequests[0]?.status ?? null)
            : null)
        : null,
      pendingSponsorRequestId: memberId
        ? (Array.isArray(c.sponsorRequests)
            ? (c.sponsorRequests[0]?.id ?? null)
            : null)
        : null,
      isSponsor: memberId
        ? (Array.isArray(c.sponsorships)
            ? c.sponsorships.some((s) => s.choirId === c.id)
            : false)
        : false,
    }));

    if (!actorUserId) return mapped;

    const visibleIds = new Set(
      (
        await this.choirRules.filterPortalVisibleChoirIds(
          actorUserId,
          choirs.map((c) => ({
            id: c.id,
            code: c.code,
            choirKind: c.choirKind,
          })),
        )
      ).map((c) => c.id),
    );

    return mapped.filter((c) => visibleIds.has(c.id));
  }
}
