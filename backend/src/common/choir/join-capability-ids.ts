/** v1 join / membership review capabilities — do not extend without review. */
export const CHOIR_JOIN_CAPABILITY_IDS = [
  'choir.join.review@choir',
  'choir.member.manage@choir',
] as const;

export type ChoirJoinCapabilityId = (typeof CHOIR_JOIN_CAPABILITY_IDS)[number];
