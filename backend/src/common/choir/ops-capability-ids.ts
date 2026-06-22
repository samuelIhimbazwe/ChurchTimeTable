/** v1 choir operations / scheduling capabilities — do not extend without review. */
export const CHOIR_OPS_CAPABILITY_IDS = [
  'choir.ops.view@choir',
  'choir.ops.manage@choir',
  'choir.ops.schedule@choir',
  'choir.ops.attendance@choir',
] as const;

export type ChoirOpsCapabilityId = (typeof CHOIR_OPS_CAPABILITY_IDS)[number];
