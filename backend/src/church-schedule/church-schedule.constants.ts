/** Protocol scope id for church master schedule submissions (single protocol unit in v1). */
export const PROTOCOL_SCHEDULE_SCOPE_ID = 'protocol';

export const CHURCH_SCHEDULE_AUDIT = {
  SUBMISSION_CREATED: 'church_schedule.submission.created',
  SUBMISSION_SUBMITTED: 'church_schedule.submission.submitted',
  SUBMISSION_AUTO_PUBLISHED: 'church_schedule.submission.auto_published',
  SUBMISSION_CONFLICT_HELD: 'church_schedule.submission.conflict_held',
  SUBMISSION_RESOLVED: 'church_schedule.submission.resolved',
  ENTRY_CREATED: 'church_schedule.entry.created',
  ENTRY_UPDATED: 'church_schedule.entry.updated',
  ENTRY_CANCELLED: 'church_schedule.entry.cancelled',
} as const;

/** Default church rooms for master schedule (Phase A seed). */
export const DEFAULT_CHURCH_FACILITIES = [
  {
    code: 'SANCTUARY',
    name: 'Sanctuary',
    building: 'Main',
    requiresAdminNotify: true,
    sortOrder: 1,
    capacity: 800,
  },
  {
    code: 'MAIN_HALL',
    name: 'Main Hall',
    building: 'Main',
    requiresAdminNotify: false,
    sortOrder: 2,
    capacity: 300,
  },
  {
    code: 'SIDE_HALL',
    name: 'Side Hall',
    building: 'Main',
    requiresAdminNotify: false,
    sortOrder: 3,
    capacity: 120,
  },
  {
    code: 'YOUTH_ROOM',
    name: 'Youth Room',
    building: 'Annex',
    requiresAdminNotify: false,
    sortOrder: 4,
    capacity: 80,
  },
  {
    code: 'PROTOCOL_OFFICE',
    name: 'Protocol Office',
    building: 'Main',
    requiresAdminNotify: false,
    sortOrder: 5,
    capacity: 30,
  },
  {
    code: 'CHOIR_ROOM',
    name: 'Choir Room',
    building: 'Main',
    requiresAdminNotify: false,
    sortOrder: 6,
    capacity: 60,
  },
] as const;
