/** Sprint 10 v1.3 — configurable needs-attention thresholds. */
export const CONTRIBUTION_NEEDS_ATTENTION_THRESHOLDS = {
  /** Minimum SUBMITTED count before backlog flag. */
  pendingBacklogCount: 1,
  /** Campaign progress below this % triggers low-goal flag. */
  lowGoalAttainmentPct: 25,
  /** No CONFIRMED activity within this many days triggers inactivity flag. */
  noActivityDays: 90,
} as const;

export const REPORTING_CAMPAIGN_STATUSES = ['ACTIVE', 'COMPLETED'] as const;
