import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsResolver } from '../auth/permissions.resolver';

@Injectable()
export class ChoirMyFamilyService {
  constructor(
    private prisma: PrismaService,
    private permissions: PermissionsResolver,
  ) {}

  async getMyFamily(userId: string, choirId: string) {
    const resolved = await this.permissions.resolveForUser(userId);
    if (!resolved.memberId) {
      throw new ForbiddenException('Member profile required');
    }

    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
      select: { id: true },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }

    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId, choirId } },
    });
    if (!membership?.isActive) {
      throw new ForbiddenException('Not a member of this choir');
    }

    const familyMember = await this.prisma.familyMember.findUnique({
      where: { memberId: resolved.memberId },
      include: {
        family: {
          include: {
            headMember: {
              select: { id: true, firstName: true, lastName: true, memberNumber: true },
            },
            members: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    memberNumber: true,
                  },
                },
              },
              orderBy: { joinedAt: 'asc' },
            },
          },
        },
      },
    });

    if (!familyMember) {
      throw new NotFoundException('You are not assigned to a family yet');
    }

    const family = familyMember.family;
    if (family.choirId && family.choirId !== choirId) {
      throw new NotFoundException('Your family is not linked to this choir');
    }

    return {
      family: {
        id: family.id,
        code: family.familyCode,
        name: family.familyName,
        head: family.headMember
          ? {
              id: family.headMember.id,
              name: `${family.headMember.firstName} ${family.headMember.lastName}`.trim(),
              memberNumber: family.headMember.memberNumber,
            }
          : null,
        myRole: familyMember.role,
        payment: {
          momoNumber: family.paymentMomoNumber,
          momoAccountName: family.paymentMomoAccountName,
          bankAccount: family.paymentBankAccount,
          bankName: family.paymentBankName,
          instructions: family.paymentInstructions,
        },
        members: family.members.map((row) => ({
          id: row.member.id,
          name: `${row.member.firstName} ${row.member.lastName}`.trim(),
          memberNumber: row.member.memberNumber,
          role: row.role,
          isMe: row.memberId === resolved.memberId,
        })),
      },
    };
  }
}
