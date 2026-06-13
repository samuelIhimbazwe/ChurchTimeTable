import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissionsResolver } from '../auth/permissions.resolver';
import { PERMISSIONS, ROLES } from '../common/constants/roles';
import { hasEffectivePermission } from '../common/governance/governance-permissions.util';
import { activeChoirCommitteeMemberWhere } from '../common/governance/choir-committee-member.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePresidentDelegationDto } from './dto/update-president-delegation.dto';

export type PresidentDelegationSettings = {
  presidentOutOfOffice: boolean;
  presidentDelegationJoinReview: boolean;
};

@Injectable()
export class ChoirGovernanceService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async getPresidentDelegation(choirId: string): Promise<PresidentDelegationSettings> {
    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: {
        presidentOutOfOffice: true,
        presidentDelegationJoinReview: true,
      },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }
    return {
      presidentOutOfOffice: choir.presidentOutOfOffice,
      presidentDelegationJoinReview: choir.presidentDelegationJoinReview,
    };
  }

  async updatePresidentDelegation(
    actorUserId: string,
    choirId: string,
    dto: UpdatePresidentDelegationDto,
  ): Promise<PresidentDelegationSettings> {
    await this.assertCanManagePresidentDelegation(actorUserId, choirId);

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }

    const updated = await this.prisma.choir.update({
      where: { id: choirId },
      data: {
        ...(dto.presidentOutOfOffice !== undefined
          ? { presidentOutOfOffice: dto.presidentOutOfOffice }
          : {}),
        ...(dto.presidentDelegationJoinReview !== undefined
          ? { presidentDelegationJoinReview: dto.presidentDelegationJoinReview }
          : {}),
      },
      select: {
        presidentOutOfOffice: true,
        presidentDelegationJoinReview: true,
      },
    });

    return updated;
  }

  private async assertCanManagePresidentDelegation(
    actorUserId: string,
    choirId: string,
  ): Promise<void> {
    const resolved = await this.permissions.resolveForUser(actorUserId);
    if (
      resolved.roles.includes(ROLES.CHOIR_PRESIDENT) ||
      hasEffectivePermission(resolved.permissions, PERMISSIONS.CHOIR_OPERATIONS_MANAGE)
    ) {
      return;
    }

    const member = resolved.memberId
      ? await this.prisma.member.findUnique({
          where: { id: resolved.memberId },
          select: { id: true },
        })
      : null;

    if (member) {
      const presidentAssignment = await this.prisma.choirCommitteeMember.findFirst({
        where: {
          choirId,
          memberId: member.id,
          role: { name: 'president' },
          ...activeChoirCommitteeMemberWhere(),
        },
        select: { id: true },
      });
      if (presidentAssignment) return;
    }

    throw new ForbiddenException('Only the choir president can update delegation settings');
  }
}
