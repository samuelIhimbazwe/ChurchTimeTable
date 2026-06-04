import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';
import { getActiveChoirId } from '../common/choir/choir-context.storage';

export interface UserChoirSummary {
  id: string;
  name: string;
  code: string;
  role: string;
  isActive: boolean;
}

@Injectable()
export class ChoirContextService {
  constructor(private prisma: PrismaService) {}

  getActiveChoirId(): string {
    return getActiveChoirId();
  }

  async listUserChoirs(userId: string): Promise<UserChoirSummary[]> {
    const memberships = await this.prisma.choirMembership.findMany({
      where: { userId, isActive: true },
      include: { choir: true },
      orderBy: { choir: { name: 'asc' } },
    });

    if (memberships.length === 0) {
      const main = await this.prisma.choir.findUnique({
        where: { id: MAIN_CHOIR_ID },
      });
      if (main) {
        return [
          {
            id: main.id,
            name: main.name,
            code: main.code,
            role: 'MEMBER',
            isActive: true,
          },
        ];
      }
    }

    return memberships.map((m) => ({
      id: m.choir.id,
      name: m.choir.name,
      code: m.choir.code,
      role: m.role,
      isActive: m.choir.isActive,
    }));
  }

  async validateMembership(userId: string, choirId: string): Promise<void> {
    if (choirId === MAIN_CHOIR_ID) {
      return;
    }

    const membership = await this.prisma.choirMembership.findUnique({
      where: { userId_choirId: { userId, choirId } },
    });

    if (!membership?.isActive) {
      throw new ForbiddenException('Not a member of this choir');
    }
  }

  async resolveChoir(userId: string, choirId: string) {
    await this.validateMembership(userId, choirId);
    const choir = await this.prisma.choir.findFirst({
      where: { id: choirId, isActive: true },
    });
    if (!choir) {
      throw new NotFoundException('Choir not found');
    }
    return choir;
  }

  async ensureMembership(
    userId: string,
    choirId: string,
    role: string,
  ): Promise<void> {
    await this.prisma.choirMembership.upsert({
      where: { userId_choirId: { userId, choirId } },
      create: { userId, choirId, role, isActive: true },
      update: { role, isActive: true },
    });
  }
}
