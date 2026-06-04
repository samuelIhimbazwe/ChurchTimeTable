import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChoirDiscoveryService {
  constructor(private prisma: PrismaService) {}

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
      where: { isActive: true, isPublicJoinable: true },
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
      },
    });

    return choirs.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      choirKind: c.choirKind,
      leader: c.leaderDisplayName,
      membershipCount: c._count.memberships,
      joinStatus: memberId ? (c.joinRequests[0]?.status ?? null) : null,
      pendingRequestId: memberId ? (c.joinRequests[0]?.id ?? null) : null,
    }));
  }
}
