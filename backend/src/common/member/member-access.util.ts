import { ForbiddenException } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export async function getMemberForUser(
  prisma: PrismaService,
  userId: string,
) {
  return prisma.member.findFirst({
    where: { userId },
    select: {
      id: true,
      status: true,
      ministry: true,
      firstName: true,
      lastName: true,
      onboardingCompleted: true,
    },
  });
}

export function isPendingMember(
  status: MemberStatus | string | undefined,
): boolean {
  return status === MemberStatus.PENDING;
}

export async function assertOperationalMemberAccess(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  const member = await getMemberForUser(prisma, userId);
  if (member && isPendingMember(member.status)) {
    throw new ForbiddenException({
      code: 'FORBIDDEN',
      messageKey: 'MEMBER_PENDING_APPROVAL',
    });
  }
}
