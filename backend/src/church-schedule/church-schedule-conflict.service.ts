import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PUBLISHED_ENTRY_SOURCES,
  rangesOverlap,
  type TimeRange,
} from './church-schedule.util';

export type ConflictHit = {
  entryId: string;
  title: string;
  startAt: Date;
  endAt: Date;
  facilityId: string;
  facilityName: string;
  isChurchBlock: boolean;
};

export type ScheduleAlternative = {
  facilityId: string;
  facilityName: string;
  startAt: string;
  endAt: string;
  label: string;
};

const FACILITY_INCLUDE = {
  facility: { select: { id: true, name: true, isActive: true } },
} as const;

@Injectable()
export class ChurchScheduleConflictService {
  constructor(private prisma: PrismaService) {}

  async findConflicts(
    range: TimeRange,
    facilityId: string,
    excludeEntryId?: string,
  ): Promise<ConflictHit[]> {
    const entries = await this.prisma.churchScheduleEntry.findMany({
      where: {
        facilityId,
        cancelledAt: null,
        source: { in: PUBLISHED_ENTRY_SOURCES },
        ...(excludeEntryId ? { id: { not: excludeEntryId } } : {}),
        startAt: { lt: range.endAt },
        endAt: { gt: range.startAt },
      },
      include: FACILITY_INCLUDE,
      orderBy: { startAt: 'asc' },
    });

    return entries.map((e) => ({
      entryId: e.id,
      title: e.title,
      startAt: e.startAt,
      endAt: e.endAt,
      facilityId: e.facilityId,
      facilityName: e.facility.name,
      isChurchBlock: e.isChurchBlock,
    }));
  }

  formatConflictReason(hits: ConflictHit[]): string {
    if (!hits.length) return '';
    const first = hits[0];
    return `Clashes with "${first.title}" in ${first.facilityName}`;
  }

  async suggestAlternatives(
    range: TimeRange,
    facilityId: string,
    max = 3,
  ): Promise<ScheduleAlternative[]> {
    const facilities = await this.prisma.churchFacility.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const facility = facilities.find((f) => f.id === facilityId);
    if (!facility) return [];

    const durationMs = range.endAt.getTime() - range.startAt.getTime();
    const alternatives: ScheduleAlternative[] = [];
    const dayStart = new Date(range.startAt);
    dayStart.setHours(6, 0, 0, 0);

    // 1) Same room, nearest free slot same day
    for (let offsetMin = 30; offsetMin <= 12 * 60; offsetMin += 30) {
      for (const sign of [-1, 1] as const) {
        const startAt = new Date(range.startAt.getTime() + sign * offsetMin * 60_000);
        const endAt = new Date(startAt.getTime() + durationMs);
        if (startAt < dayStart) continue;
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(22, 0, 0, 0);
        if (endAt > dayEnd) continue;
        const conflicts = await this.findConflicts(
          { startAt, endAt },
          facilityId,
        );
        if (!conflicts.length) {
          alternatives.push({
            facilityId,
            facilityName: facility.name,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            label: `Same room, ${sign < 0 ? 'earlier' : 'later'} slot`,
          });
          break;
        }
      }
      if (alternatives.length) break;
    }

    // 2) Same time, other room
    for (const other of facilities) {
      if (other.id === facilityId) continue;
      const conflicts = await this.findConflicts(range, other.id);
      if (!conflicts.length) {
        alternatives.push({
          facilityId: other.id,
          facilityName: other.name,
          startAt: range.startAt.toISOString(),
          endAt: range.endAt.toISOString(),
          label: 'Same time, different room',
        });
        break;
      }
    }

    // 3) Same room, adjacent day
    for (const dayOffset of [1, -1]) {
      const startAt = new Date(range.startAt);
      startAt.setDate(startAt.getDate() + dayOffset);
      const endAt = new Date(startAt.getTime() + durationMs);
      const conflicts = await this.findConflicts({ startAt, endAt }, facilityId);
      if (!conflicts.length) {
        alternatives.push({
          facilityId,
          facilityName: facility.name,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          label: dayOffset > 0 ? 'Next day, same time' : 'Previous day, same time',
        });
        break;
      }
    }

    return alternatives.slice(0, max);
  }

  overlapsAnyPublished(
    range: TimeRange,
    entries: Array<{ startAt: Date; endAt: Date }>,
  ) {
    return entries.some((e) => rangesOverlap(range, e));
  }

  alternativesToJson(
    items: ScheduleAlternative[],
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (!items.length) return Prisma.JsonNull;
    return items as unknown as Prisma.InputJsonValue;
  }
}
