import { BadRequestException, Injectable } from '@nestjs/common';
import { ChoirKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { YERUSALEMU_CHOIR_CODE } from './member-portal.constants';

@Injectable()
export class ChoirMembershipRulesService {
  constructor(private prisma: PrismaService) {}

  async validateNewMembership(userId: string, targetChoirId: string): Promise<void> {
    const target = await this.prisma.choir.findUniqueOrThrow({
      where: { id: targetChoirId },
    });

    const active = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      include: { choir: true },
    });

    if (active.some((m) => m.choirId === targetChoirId)) {
      throw new BadRequestException('Already a member of this choir');
    }

    if (target.choirKind === ChoirKind.SPECIAL) {
      return;
    }

    const hasPrimarySlot = active.some(
      (m) =>
        m.choir.choirKind === ChoirKind.PRIMARY ||
        m.choir.choirKind === ChoirKind.CHILDREN,
    );

    if (
      (target.choirKind === ChoirKind.PRIMARY ||
        target.choirKind === ChoirKind.CHILDREN) &&
      hasPrimarySlot
    ) {
      throw new BadRequestException(
        'A member may belong to only one primary choir. Yerusalemu may be added as an additional special choir.',
      );
    }
  }

  async describeMembershipRules(userId: string) {
    const active = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      include: { choir: { select: { name: true, code: true, choirKind: true } } },
    });
    return {
      activeChoirs: active.map((m) => ({
        id: m.choirId,
        name: m.choir.name,
        code: m.choir.code,
        kind: m.choir.choirKind,
      })),
      rules: {
        onePrimaryChoir: true,
        yerusalemuException: true,
        yerusalemuCode: YERUSALEMU_CHOIR_CODE,
      },
    };
  }
}
