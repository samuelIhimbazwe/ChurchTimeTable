import {
  ChurchScheduleActivityType,
  ChurchScheduleEntrySource,
  ChurchScheduleScopeType,
} from '@prisma/client';

export type TimeRange = { startAt: Date; endAt: Date };

/** Half-open interval overlap: [a.start, a.end) vs [b.start, b.end). */
export function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export function assertValidTimeRange(startAt: Date, endAt: Date) {
  if (!(startAt instanceof Date) || Number.isNaN(startAt.getTime())) {
    throw new Error('Invalid startAt');
  }
  if (!(endAt instanceof Date) || Number.isNaN(endAt.getTime())) {
    throw new Error('Invalid endAt');
  }
  if (endAt <= startAt) {
    throw new Error('endAt must be after startAt');
  }
}

export const PUBLISHED_ENTRY_SOURCES: ChurchScheduleEntrySource[] = [
  ChurchScheduleEntrySource.CHURCH_DIRECT,
  ChurchScheduleEntrySource.AUTO_PUBLISHED,
  ChurchScheduleEntrySource.ADMIN_PUBLISHED,
  ChurchScheduleEntrySource.OVERRIDE,
];

export const CHOIR_SCHEDULE_OFFICER_ROLES = [
  'CHOIR_PRESIDENT',
  'CHOIR_VICE_PRESIDENT',
  'CHOIR_SECRETARY',
  'CHOIR_ADMIN',
  'CHOIR_LEADER',
] as const;

export const PROTOCOL_SCHEDULE_OFFICER_ROLES = [
  'PROTOCOL_ADMIN',
  'PROTOCOL_LEADER',
] as const;

export type ScheduleScopeRef = {
  scopeType: ChurchScheduleScopeType;
  scopeId: string;
  label: string;
};

export function formatScopeLabel(
  scopeType: ChurchScheduleScopeType,
  name: string,
): string {
  switch (scopeType) {
    case ChurchScheduleScopeType.CHOIR:
      return `Choir: ${name}`;
    case ChurchScheduleScopeType.MINISTRY:
      return `Ministry: ${name}`;
    case ChurchScheduleScopeType.PROTOCOL:
      return 'Protocol';
    case ChurchScheduleScopeType.OPERATIONAL_UNIT:
      return `Unit: ${name}`;
    default:
      return name;
  }
}

export const SUBMITTABLE_ACTIVITY_TYPES: ChurchScheduleActivityType[] = [
  ChurchScheduleActivityType.PRAYER,
  ChurchScheduleActivityType.REHEARSAL,
  ChurchScheduleActivityType.MEETING,
  ChurchScheduleActivityType.TRAINING,
  ChurchScheduleActivityType.CONCERT,
  ChurchScheduleActivityType.FELLOWSHIP,
  ChurchScheduleActivityType.OTHER_CHURCH_FACING,
];
