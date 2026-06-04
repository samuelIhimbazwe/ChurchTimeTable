export const PILOT_READY_AUDIT = {
  IMPORT_PREVIEW: 'PILOT_IMPORT_PREVIEW',
  IMPORT_CONFIRMED: 'PILOT_IMPORT_CONFIRMED',
  BULK_ACTION: 'PILOT_BULK_ACTION',
  EXPORT: 'PILOT_EXPORT',
  SIMULATION_RUN: 'PILOT_SIMULATION_RUN',
} as const;

export const DEFAULT_NOTIFICATION_RULES = [
  { trigger: 'SERVICE_TOMORROW', channel: 'IN_APP' },
  { trigger: 'SERVICE_TODAY', channel: 'IN_APP' },
  { trigger: 'REHEARSAL_TOMORROW', channel: 'IN_APP' },
  { trigger: 'REHEARSAL_TODAY', channel: 'IN_APP' },
  { trigger: 'EVENT_REMINDER', channel: 'IN_APP' },
  { trigger: 'PROTOCOL_ASSIGNMENT', channel: 'IN_APP' },
  { trigger: 'CHOIR_ASSIGNMENT', channel: 'IN_APP' },
  { trigger: 'SCHEDULE_CHANGE', channel: 'IN_APP' },
  { trigger: 'REPLACEMENT_APPROVED', channel: 'IN_APP' },
  { trigger: 'INVITATION_RECEIVED', channel: 'IN_APP' },
  { trigger: 'REQUEST_APPROVED', channel: 'IN_APP' },
  { trigger: 'REQUEST_REJECTED', channel: 'IN_APP' },
] as const;
