import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
