import { Injectable } from '@nestjs/common';
import { DevotionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChurchBrandingService } from './church-branding.service';

@Injectable()
export class ChurchWelcomeService {
  constructor(
    private prisma: PrismaService,
    private branding: ChurchBrandingService,
  ) {}

  async welcomePage() {
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);

    const [branding, verse, services, broadcasts, live] = await Promise.all([
      this.branding.getPublicBranding(),
      this.prisma.devotion.findFirst({
        where: {
          type: DevotionType.VERSE_OF_DAY,
          publishedAt: { lte: now },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.operationOccurrence.findMany({
        where: {
          status: { in: ['PUBLISHED', 'APPROVED'] },
          startAt: { gte: now, lte: in30 },
        },
        orderBy: { startAt: 'asc' },
        take: 5,
        select: { id: true, title: true, startAt: true, endAt: true },
      }),
      this.prisma.churchBroadcast.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          thumbnail: true,
          youtubeUrl: true,
          isLive: true,
          broadcastType: true,
        },
      }),
      this.prisma.churchBroadcast.findFirst({
        where: { isLive: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      branding,
      verseOfDay: verse,
      upcomingServices: services,
      upcomingEvents: services,
      recentBroadcasts: broadcasts,
      liveBroadcast: live,
    };
  }
}
