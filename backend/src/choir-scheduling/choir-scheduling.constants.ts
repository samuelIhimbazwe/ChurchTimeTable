import { ChoirServiceAssignmentRole } from '@prisma/client';

export const CHOIR_SCHEDULING_AUDIT = {
  ACTIVITY_CREATED: 'CHOIR_ACTIVITY_CREATED',
  ASSIGNMENT_CREATED: 'CHOIR_SERVICE_ASSIGNMENT_CREATED',
  ASSIGNMENT_ADJUSTED: 'CHOIR_SCHEDULE_ADJUSTED',
  PLAN_GENERATED: 'CHOIR_SCHEDULE_PLAN_GENERATED',
  PLAN_PUBLISHED: 'CHOIR_SCHEDULE_PLAN_PUBLISHED',
  ATTENDANCE_RECORDED: 'CHOIR_ATTENDANCE_RECORDED',
  RANKING_GENERATED: 'CHOIR_RANKING_GENERATED',
  REPORT_EXPORTED: 'CHOIR_REPORT_EXPORTED',
} as const;

export type ServiceSlotRule = {
  templateCode: string;
  slots: Array<{
    role: ChoirServiceAssignmentRole;
    count: number;
    preferChildren?: boolean;
    preferFifthSunday?: boolean;
  }>;
};

export const DEFAULT_SERVICE_SLOT_RULES: ServiceSlotRule[] = [
  {
    templateCode: 'SUNDAY_SERVICE_1',
    slots: [
      { role: 'CHILDREN', count: 1, preferChildren: true },
      { role: 'PRIMARY', count: 2 },
    ],
  },
  {
    templateCode: 'SUNDAY_SERVICE_2',
    slots: [{ role: 'PRIMARY', count: 2 }],
  },
  {
    templateCode: 'TUESDAY_SERVICE',
    slots: [{ role: 'PRIMARY', count: 1 }],
  },
  {
    templateCode: 'IGABURO',
    slots: [{ role: 'PRIMARY', count: 1 }],
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
  IGABURO: 'SERVICE',
};
