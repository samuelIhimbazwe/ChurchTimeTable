import { ChoirServiceAssignmentRole } from '@prisma/client';

export const CHOIR_SCHEDULING_AUDIT = {
  ACTIVITY_CREATED: 'CHOIR_ACTIVITY_CREATED',
  ASSIGNMENT_CREATED: 'CHOIR_SERVICE_ASSIGNMENT_CREATED',
  ASSIGNMENT_CONFIRMED: 'CHOIR_SERVICE_ASSIGNMENT_CONFIRMED',
  ASSIGNMENT_ACCEPTED: 'CHOIR_SERVICE_ASSIGNMENT_ACCEPTED',
  ASSIGNMENT_DECLINED: 'CHOIR_SERVICE_ASSIGNMENT_DECLINED',
  ASSIGNMENT_REJECTED: 'CHOIR_SERVICE_ASSIGNMENT_REJECTED',
  ASSIGNMENT_ADJUSTED: 'CHOIR_SCHEDULE_ADJUSTED',
  PLAN_GENERATED: 'CHOIR_SCHEDULE_PLAN_GENERATED',
  PLAN_APPROVED: 'CHOIR_SCHEDULE_PLAN_APPROVED',
  PLAN_PUBLISHED: 'CHOIR_SCHEDULE_PLAN_PUBLISHED',
  ATTENDANCE_RECORDED: 'CHOIR_ATTENDANCE_RECORDED',
  RANKING_GENERATED: 'CHOIR_RANKING_GENERATED',
  REPORT_EXPORTED: 'CHOIR_REPORT_EXPORTED',
} as const;

export type ServiceSlotSpec = {
  role: ChoirServiceAssignmentRole;
  count: number;
  preferChildren?: boolean;
  preferFifthSunday?: boolean;
  /** Fixed choir code (e.g. children's choir every SS1, WORSHIP_TEAM every Tuesday). */
  preferChoirCode?: string;
  /** When false with preferChoirCode, always pick that choir. Default true. */
  rotate?: boolean;
};

export type ServiceSlotRule = {
  templateCode: string;
  slots: ServiceSlotSpec[];
};

/** Matches ADEPR Kacyiru monthly choir roster patterns. */
export const DEFAULT_SERVICE_SLOT_RULES: ServiceSlotRule[] = [
  {
    templateCode: 'SUNDAY_SERVICE_1',
    slots: [
      { role: 'CHILDREN', count: 1, preferChoirCode: 'CHILDREN_CHOIR', rotate: false },
      { role: 'PRIMARY', count: 2 },
    ],
  },
  {
    templateCode: 'SUNDAY_SERVICE_2',
    slots: [{ role: 'PRIMARY', count: 2 }],
  },
  {
    templateCode: 'TUESDAY_SERVICE',
    slots: [
      { role: 'SUPPORTING', count: 1, preferChoirCode: 'WORSHIP_TEAM', rotate: false },
      { role: 'PRIMARY', count: 1 },
    ],
  },
  {
    templateCode: 'FRIDAY_SERVICE',
    slots: [{ role: 'PRIMARY', count: 1 }],
  },
  {
    templateCode: 'IGABURO',
    slots: [{ role: 'PRIMARY', count: 2 }],
  },
];

/** Last Sunday of month: SS2 + 2 primary + optional 5th choir */
export const LAST_SUNDAY_EXTRA_RULE = {
  baseTemplate: 'SUNDAY_SERVICE_2',
  slots: [
    { role: 'PRIMARY' as ChoirServiceAssignmentRole, count: 2 },
    { role: 'PRIMARY' as ChoirServiceAssignmentRole, count: 1, preferFifthSunday: true },
  ],
};

export const ACTIVITY_TYPE_FOR_TEMPLATE: Record<string, 'SERVICE'> = {
  SUNDAY_SERVICE_1: 'SERVICE',
  SUNDAY_SERVICE_2: 'SERVICE',
  TUESDAY_SERVICE: 'SERVICE',
  FRIDAY_SERVICE: 'SERVICE',
  IGABURO: 'SERVICE',
};

export const SERVICE_TEMPLATE_LABELS: Record<string, { en: string; rw: string }> = {
  SUNDAY_SERVICE_1: { en: 'Sunday Service I', rw: 'Iteraniro rya Mbere' },
  SUNDAY_SERVICE_2: { en: 'Sunday Service II', rw: 'Iteraniro rya Kabiri' },
  TUESDAY_SERVICE: { en: 'Tuesday Service', rw: 'Kuwa Kabiri' },
  FRIDAY_SERVICE: { en: 'Friday Service', rw: 'Kuwa Gatanu' },
  IGABURO: { en: 'Holy Communion', rw: 'Igaburo Ryera' },
};

export const SERVICE_DEFAULT_TIMES: Record<
  string,
  { startHour: number; startMinute: number; endHour: number; endMinute: number }
> = {
  SUNDAY_SERVICE_1: { startHour: 8, startMinute: 0, endHour: 10, endMinute: 0 },
  SUNDAY_SERVICE_2: { startHour: 10, startMinute: 30, endHour: 12, endMinute: 30 },
  TUESDAY_SERVICE: { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  FRIDAY_SERVICE: { startHour: 18, startMinute: 0, endHour: 20, endMinute: 0 },
  IGABURO: { startHour: 17, startMinute: 0, endHour: 19, endMinute: 0 },
};
