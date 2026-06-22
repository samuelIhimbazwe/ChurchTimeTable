/** v1 discipline workflow capabilities — do not extend without review. */
export const CHOIR_DISCIPLINE_CAPABILITY_IDS = [
  'choir.discipline.view@choir',
  'choir.discipline.manage@choir',
  'choir.discipline.review@choir',
] as const;

export type ChoirDisciplineCapabilityId =
  (typeof CHOIR_DISCIPLINE_CAPABILITY_IDS)[number];
