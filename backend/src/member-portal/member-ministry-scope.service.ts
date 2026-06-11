import { Injectable } from '@nestjs/common';
import { MinistryScope } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProtocolMembershipService } from './protocol-membership.service';

@Injectable()
export class MemberMinistryScopeService {
  constructor(
    private prisma: PrismaService,
    private protocolMembership: ProtocolMembershipService,
  ) {}

  async hasActiveChoirMembership(memberId: string): Promise<boolean> {
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { id: memberId },
      select: { userId: true },
    });
    const count = await this.prisma.choirMembership.count({
      where: { userId: member.userId, isActive: true },
    });
    return count > 0;
  }

  async resolveMinistryScope(memberId: string): Promise<MinistryScope> {
    const [hasChoir, hasProtocol] = await Promise.all([
      this.hasActiveChoirMembership(memberId),
      this.protocolMembership.isProtocolMember(memberId),
    ]);
    if (hasChoir && hasProtocol) return MinistryScope.BOTH;
    if (hasChoir) return MinistryScope.CHOIR;
    if (hasProtocol) return MinistryScope.PROTOCOL;
    const member = await this.prisma.member.findUniqueOrThrow({
      where: { id: memberId },
      select: { ministry: true },
    });
    return member.ministry;
  }

  /** Recompute and persist Member.ministry from active choir + protocol memberships. */
  async syncMinistryScope(memberId: string): Promise<MinistryScope> {
    const next = await this.resolveMinistryScope(memberId);
    await this.prisma.member.update({
      where: { id: memberId },
      data: { ministry: next },
    });
    return next;
  }
}
