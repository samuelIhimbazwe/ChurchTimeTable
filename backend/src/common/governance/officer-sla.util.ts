/** Join requests waiting on president / VP decision. */
export const JOIN_REVIEW_STALE_HOURS = 48;

/** Family-approved gifts waiting on treasurer verification. */
export const TREASURY_VERIFY_STALE_HOURS = 72;

export function hoursSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
}

export function isStaleHours(ageHours: number | null, limitHours: number): boolean {
  return ageHours !== null && ageHours >= limitHours;
}
