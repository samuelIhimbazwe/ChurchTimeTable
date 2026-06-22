/** v1 sponsor request capabilities — do not extend without review. */
export const CHOIR_SPONSOR_CAPABILITY_IDS = [
  'choir.sponsor.review@choir',
  'choir.member.manage@choir',
] as const;

export type ChoirSponsorCapabilityId =
  (typeof CHOIR_SPONSOR_CAPABILITY_IDS)[number];
