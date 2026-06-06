import { Injectable } from '@nestjs/common';
import { DevotionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MAIN_CHOIR_ID } from '../common/constants/choir.constants';

const SECTION_TYPES: Record<string, DevotionType[]> = {
  testimonies: [DevotionType.TESTIMONY],
  encouragements: [DevotionType.ENCOURAGEMENT],
  gratitude: [DevotionType.GRATITUDE],
  praises: [DevotionType.PRAISE],
};

@Injectable()
export class MemberPortalDevotionService {
  constructor(private prisma: PrismaService) {}

  private publishedFilter(now = new Date()) {
    return {
      publishedAt: { lte: now, not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
  }

  private churchDevotionWhere(now = new Date()) {
    return {
      ...this.publishedFilter(now),
      OR: [{ choirId: MAIN_CHOIR_ID }, { choirId: null }],
    };
  }

  async devotionCenter() {
    const now = new Date();
    const base = this.churchDevotionWhere(now);

    const [verseOfDay, twoDayPrayers, testimonies, encouragements, gratitude, praises] =
      await Promise.all([
        this.prisma.devotion.findFirst({
          where: { ...base, type: DevotionType.VERSE_OF_DAY },
          orderBy: { publishedAt: 'desc' },
        }),
        this.twoDayPrayers(now),
        this.sectionItems(base, DevotionType.TESTIMONY),
        this.sectionItems(base, DevotionType.ENCOURAGEMENT),
        this.sectionItems(base, DevotionType.GRATITUDE),
        this.sectionItems(base, DevotionType.PRAISE),
      ]);

    return {
      verseOfDay,
      twoDayPrayers,
      prayWithUs: {
        twoDayPrayers,
        prayerRequestHint:
          'Share your prayer needs (ibyifuzo). You may remain anonymous unless you choose to be known.',
      },
      sections: {
        testimonies,
        encouragements,
        gratitude,
        praises,
      },
      sectionLabels: SECTION_TYPES,
    };
  }

  async portalPrayPreview() {
    const now = new Date();
    const twoDayPrayers = await this.twoDayPrayers(now);
    return {
      twoDayPrayers,
      devotionPath: '/portal/devotion',
    };
  }

  private async sectionItems(
    base: Record<string, unknown>,
    type: DevotionType,
    take = 8,
  ) {
    return this.prisma.devotion.findMany({
      where: { ...base, type },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take,
      select: {
        id: true,
        title: true,
        content: true,
        verseReference: true,
        verseText: true,
        type: true,
        publishedAt: true,
        isPinned: true,
        prayerDate: true,
      },
    });
  }

  private async twoDayPrayers(now: Date) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 2);

    const rows = await this.prisma.devotion.findMany({
      where: {
        ...this.churchDevotionWhere(now),
        type: DevotionType.TWO_DAY_PRAYER,
        OR: [
          { prayerDate: { gte: start, lt: end } },
          { prayerDate: null },
        ],
      },
      orderBy: [{ prayerDate: 'asc' }, { publishedAt: 'desc' }],
      take: 4,
    });

    const dayLabels = ['Today', 'Tomorrow'];
    const result: Array<{
      dayLabel: string;
      date: string;
      title: string;
      content: string;
      id: string;
    }> = [];

    for (let i = 0; i < 2; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const match =
        rows.find((r) => r.prayerDate && this.sameDay(r.prayerDate, d)) ??
        rows[i] ??
        null;
      if (match) {
        result.push({
          id: match.id,
          dayLabel: dayLabels[i] ?? `Day ${i + 1}`,
          date: d.toISOString(),
          title: match.title,
          content: match.content,
        });
      }
    }

    return result;
  }

  private sameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
