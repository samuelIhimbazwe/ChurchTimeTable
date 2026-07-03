import {
  ChurchOperationType,
  OperationAssignmentType,
} from '@prisma/client';

export const OPERATIONS_AUDIT = {
  OCCURRENCE_CREATED: 'OPERATION_OCCURRENCE_CREATED',
  OCCURRENCE_STATUS: 'OPERATION_OCCURRENCE_STATUS',
  OCCURRENCE_PUBLISHED: 'OPERATION_OCCURRENCE_PUBLISHED',
  ASSIGNMENT_CREATED: 'OPERATION_ASSIGNMENT_CREATED',
  ASSIGNMENT_STATUS: 'OPERATION_ASSIGNMENT_STATUS',
  ASSIGNMENT_OVERRIDE: 'OPERATION_ASSIGNMENT_OVERRIDE',
  CONFLICT_RESOLVED: 'OPERATION_CONFLICT_RESOLVED',
  REPORT_EXPORTED: 'OPERATION_REPORT_EXPORTED',
} as const;

export const OPERATIONS_AUDIT_ENTITY = 'OperationOccurrence';

export const SYSTEM_OPERATION_TEMPLATES: Array<{
  code: string;
  name: string;
  type: ChurchOperationType;
  description: string;
  requirements: Array<{
    assignmentType: OperationAssignmentType;
    quantity: number;
    required?: boolean;
  }>;
}> = [
  {
    code: 'SUNDAY_SERVICE_1',
    name: 'Sunday Service 1',
    type: 'SERVICE',
    description: 'First Sunday worship service',
    requirements: [
      { assignmentType: 'MAIN_CHOIR', quantity: 2 },
      { assignmentType: 'CHILDREN_CHOIR', quantity: 1 },
      { assignmentType: 'PROTOCOL_TEAM', quantity: 1 },
    ],
  },
  {
    code: 'SUNDAY_SERVICE_2',
    name: 'Sunday Service 2',
    type: 'SERVICE',
    description: 'Second Sunday worship service',
    requirements: [
      { assignmentType: 'MAIN_CHOIR', quantity: 2 },
      { assignmentType: 'PROTOCOL_TEAM', quantity: 1 },
    ],
  },
  {
    code: 'TUESDAY_SERVICE',
    name: 'Tuesday Service',
    type: 'SERVICE',
    description: 'Tuesday mid-week service',
    requirements: [
      { assignmentType: 'MAIN_CHOIR', quantity: 2 },
      { assignmentType: 'PROTOCOL_TEAM', quantity: 1 },
    ],
  },
  {
    code: 'FRIDAY_SERVICE',
    name: 'Friday Service',
    type: 'SERVICE',
    description: 'Friday evening service',
    requirements: [
      { assignmentType: 'MAIN_CHOIR', quantity: 1 },
      { assignmentType: 'PROTOCOL_TEAM', quantity: 1 },
    ],
  },
  {
    code: 'IGABURO',
    name: 'IGABURO',
    type: 'SERVICE',
    description: 'IGABURO service',
    requirements: [
      { assignmentType: 'MAIN_CHOIR', quantity: 2 },
      { assignmentType: 'PROTOCOL_TEAM', quantity: 1 },
    ],
  },
];

/** Maps assignment types to operational unit codes (seeded units) */
export const ASSIGNMENT_TYPE_UNIT_CODES: Partial<
  Record<OperationAssignmentType, string>
> = {
  MAIN_CHOIR: 'MAIN_CHOIR',
  CHILDREN_CHOIR: 'CHILDREN_CHOIR',
  PROTOCOL_TEAM: 'PROTOCOL_TEAM',
};

export const CHILDREN_CHOIR_UNIT_SEED = {
  ministryCode: 'MUSIC',
  code: 'CHILDREN_CHOIR',
  name: 'Hope',
  description: 'Hope children choir',
  type: 'CHOIR' as const,
};

export const DEFAULT_REMINDER_DAYS = [30, 14, 7, 2] as const;
