import { WelfareUrgency } from '@prisma/client';

/** Default SLA: care officer should act within N days (ServiceNow pattern). */
export const CARE_SLA_HOURS: Record<WelfareUrgency, number> = {
  CRITICAL: 24,
  HIGH: 48,
  NORMAL: 168,
  LOW: 336,
};

export function computeCareCaseSla(
  openedAt: Date,
  urgency: WelfareUrgency = WelfareUrgency.NORMAL,
) {
  const ageHours = Math.floor((Date.now() - openedAt.getTime()) / (1000 * 60 * 60));
  const slaLimitHours = CARE_SLA_HOURS[urgency] ?? CARE_SLA_HOURS.NORMAL;
  const breached = ageHours >= slaLimitHours;
  const hoursRemaining = Math.max(0, slaLimitHours - ageHours);
  return {
    ageHours,
    slaLimitHours,
    breached,
    hoursRemaining,
  };
}
