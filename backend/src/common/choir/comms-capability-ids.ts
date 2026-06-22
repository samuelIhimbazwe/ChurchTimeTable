/** v1 choir announcements / meetings capabilities — do not extend without review. */
export const CHOIR_COMMS_CAPABILITY_IDS = [
  'choir.announcement.view@choir',
  'choir.announcement.manage@choir',
  'choir.meeting.view@choir',
  'choir.meeting.manage@choir',
] as const;

export type ChoirCommsCapabilityId =
  (typeof CHOIR_COMMS_CAPABILITY_IDS)[number];
