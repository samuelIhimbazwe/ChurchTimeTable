import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export type WeeklyActivityItem = {
  id: string;
  title: string;
  description: string | null;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  ministryName: string | null;
  ministryCode: string | null;
  source: 'recurring' | 'meeting';
  scheduledAt?: string;
};

@Injectable()
export class MemberPortalWeeklyActivitiesService {
  constructor(private prisma: PrismaService) {}

  async listAll() {
    const [recurring, meetings] = await Promise.all([
      this.recurringActivities(),
      this.upcomingMeetings(60),
    ]);
    return [...recurring, ...meetings].sort((a, b) => {
      const dayA = a.source === 'meeting' && a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : a.dayOfWeek * 86400000;
      const dayB = b.source === 'meeting' && b.scheduledAt
        ? new Date(b.scheduledAt).getTime()
        : b.dayOfWeek * 86400000;
      return dayA - dayB || a.startTime.localeCompare(b.startTime);
    });
  }

  /** Nearest day with activities: today if any, else next day within a week */
  async nearestDayPreview(now = new Date()) {
    const all = await this.listAll();
    const todayDow = now.getDay();

    for (let offset = 0; offset < 7; offset++) {
      const dow = (todayDow + offset) % 7;
      const dayName = DAY_NAMES[dow];
      const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : dayName;

      const items = all.filter((a) => {
        if (a.source === 'recurring') return a.dayOfWeek === dow;
        if (!a.scheduledAt) return false;
        const d = new Date(a.scheduledAt);
        const target = new Date(now);
        target.setDate(target.getDate() + offset);
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth() &&
          d.getDate() === target.getDate()
        );
      });

      if (items.length) {
        return {
          dayLabel: label,
          dayOfWeek: dow,
          date: (() => {
            const d = new Date(now);
            d.setDate(d.getDate() + offset);
            d.setHours(0, 0, 0, 0);
            return d.toISOString();
          })(),
          activities: items,
        };
      }
    }

    return { dayLabel: null, dayOfWeek: null, date: null, activities: [] as WeeklyActivityItem[] };
  }

  private async recurringActivities(): Promise<WeeklyActivityItem[]> {
    const rows = await this.prisma.churchWeeklyActivity.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }, { startTime: 'asc' }],
      include: { ministry: { select: { name: true, code: true } } },
    });

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      dayOfWeek: r.dayOfWeek,
      dayName: DAY_NAMES[r.dayOfWeek] ?? 'Day',
      startTime: r.startTime,
      endTime: r.endTime,
      location: r.location,
      ministryName: r.ministry?.name ?? null,
      ministryCode: r.ministry?.code ?? null,
      source: 'recurring' as const,
    }));
  }

  private async upcomingMeetings(withinDays: number): Promise<WeeklyActivityItem[]> {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + withinDays);

    const rows = await this.prisma.ministryMeeting.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { gte: now, lte: end },
        ministry: { isActive: true },
      },
      orderBy: { scheduledAt: 'asc' },
      include: { ministry: { select: { name: true, code: true } } },
    });

    return rows.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      dayOfWeek: m.scheduledAt.getDay(),
      dayName: DAY_NAMES[m.scheduledAt.getDay()] ?? 'Day',
      startTime: m.scheduledAt.toISOString().slice(11, 16),
      endTime: null,
      location: m.location,
      ministryName: m.ministry.name,
      ministryCode: m.ministry.code,
      source: 'meeting' as const,
      scheduledAt: m.scheduledAt.toISOString(),
    }));
  }
}
