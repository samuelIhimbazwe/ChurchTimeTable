/** v1 choir devotion capabilities — do not extend without review. */
export const CHOIR_DEVOTION_CAPABILITY_IDS = [
  'choir.devotion.view@choir',
  'choir.devotion.create@choir',
  'choir.devotion.publish@choir',
  'choir.devotion.manage@choir',
] as const;

export type ChoirDevotionCapabilityId =
  (typeof CHOIR_DEVOTION_CAPABILITY_IDS)[number];
