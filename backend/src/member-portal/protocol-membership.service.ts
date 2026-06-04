import { Injectable } from '@nestjs/common';
import { MinistryMembershipStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProtocolMembershipService {
  constructor(private prisma: PrismaService) {}

  async ensureProtocolMembership(memberId: string) {
    const unit = await this.prisma.operationalUnit.findFirstOrThrow({
      where: { code: 'PROTOCOL_TEAM' },
    });
    const existing = await this.prisma.operationalUnitMembership.findFirst({
      where: { memberId, operationalUnitId: unit.id },
    });
    if (existing?.status === MinistryMembershipStatus.ACTIVE) {
      return existing;
    }
    if (existing) {
      return this.prisma.operationalUnitMembership.update({
        where: { id: existing.id },
        data: { status: MinistryMembershipStatus.ACTIVE },
      });
    }
    return this.prisma.operationalUnitMembership.create({
      data: {
        memberId,
        operationalUnitId: unit.id,
        status: MinistryMembershipStatus.ACTIVE,
      },
    });
  }

  async isProtocolMember(memberId: string): Promise<boolean> {
    const unit = await this.prisma.operationalUnit.findFirst({
      where: { code: 'PROTOCOL_TEAM' },
    });
    if (!unit) return false;
    const row = await this.prisma.operationalUnitMembership.findFirst({
      where: {
        memberId,
        operationalUnitId: unit.id,
        status: MinistryMembershipStatus.ACTIVE,
      },
    });
    return !!row;
  }
}
