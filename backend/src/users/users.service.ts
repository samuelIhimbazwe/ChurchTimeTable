import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MemberStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const member = await this.prisma.member.findFirst({
      where: { userId },
    });
    if (!member) {
      throw new NotFoundException('Member profile not found');
    }

    if (
      member.status !== MemberStatus.ACTIVE &&
      member.status !== MemberStatus.NEW_MEMBER
    ) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        messageKey: 'PROFILE_UPDATE_NOT_ALLOWED',
      });
    }

    const data: Prisma.MemberUpdateInput = {};
    if (dto.firstName !== undefined) {
      data.firstName = dto.firstName.trim();
    }
    if (dto.lastName !== undefined) {
      data.lastName = dto.lastName.trim();
    }
    if (dto.phone !== undefined) {
      const trimmed = dto.phone.trim();
      data.phone = trimmed.length ? trimmed.replace(/\s+/g, '') : null;
    }

    const updated = await this.prisma.member.update({
      where: { id: member.id },
      data,
      select: {
        id: true,
        memberNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        ministry: true,
        status: true,
        onboardingCompleted: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        preferredLanguage: true,
      },
    });

    return {
      id: user!.id,
      email: user!.email,
      preferredLanguage: user!.preferredLanguage,
      member: {
        ...updated,
        missingPhone:
          (updated.status === MemberStatus.ACTIVE ||
            updated.status === MemberStatus.NEW_MEMBER) &&
          !updated.phone,
      },
    };
  }

  async registerFcmToken(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
      select: { id: true, fcmToken: true },
    });
  }

  async updateLanguage(userId: string, preferredLanguage: string) {
    const allowed = ['rw', 'en', 'fr'];
    const lang = allowed.includes(preferredLanguage) ? preferredLanguage : 'rw';
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: lang },
      select: { id: true, preferredLanguage: true },
    });
  }
}
