/** v1 choir custom / committee role capabilities — do not extend without review. */
export const CHOIR_ROLES_CAPABILITY_IDS = [
  'choir.custom_role.manage@choir',
  'choir.committee_role.manage@choir',
] as const;

export type ChoirRolesCapabilityId =
  (typeof CHOIR_ROLES_CAPABILITY_IDS)[number];
