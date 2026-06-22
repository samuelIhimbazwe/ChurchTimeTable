/** v1 choir documents / uniforms / equipment capabilities — do not extend without review. */
export const CHOIR_LOGISTICS_CAPABILITY_IDS = [
  'choir.document.view@choir',
  'choir.document.manage@choir',
  'choir.uniform.view@choir',
  'choir.uniform.manage@choir',
  'choir.equipment.view@choir',
  'choir.equipment.manage@choir',
] as const;

export type ChoirLogisticsCapabilityId =
  (typeof CHOIR_LOGISTICS_CAPABILITY_IDS)[number];
