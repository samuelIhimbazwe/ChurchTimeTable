/** v1 choir roster capabilities — do not extend without review. */
export const CHOIR_ROSTER_CAPABILITY_IDS = [
  'choir.member.view@choir',
  'choir.member.manage@choir',
] as const;

export type ChoirRosterCapabilityId =
  (typeof CHOIR_ROSTER_CAPABILITY_IDS)[number];
