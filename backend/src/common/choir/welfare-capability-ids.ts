/** v1 welfare workflow capabilities — do not extend without review. */
export const CHOIR_WELFARE_CAPABILITY_IDS = [
  'choir.welfare.view@choir',
  'choir.welfare.manage@choir',
] as const;

export type ChoirWelfareCapabilityId =
  (typeof CHOIR_WELFARE_CAPABILITY_IDS)[number];
