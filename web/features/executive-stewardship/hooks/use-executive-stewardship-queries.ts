"use client";

import { useQuery } from "@tanstack/react-query";

import { getChoirRankings } from "@/features/executive-stewardship/api/getChoirRankings";
import { getChoirTotals } from "@/features/executive-stewardship/api/getChoirTotals";
import { getRecentAdjustments } from "@/features/executive-stewardship/api/getRecentAdjustments";
import { growthPercent, monthRange } from "@/features/executive-stewardship/lib/date-ranges";

export const executiveStewardshipKeys = {
  all: ["executive-stewardship"] as const,
  totals: (from?: string, to?: string) =>
    [...executiveStewardshipKeys.all, "totals", from, to] as const,
  rankings: (from?: string, to?: string) =>
    [...executiveStewardshipKeys.all, "rankings", from, to] as const,
  adjustments: () => [...executiveStewardshipKeys.all, "adjustments"] as const,
  growth: () => [...executiveStewardshipKeys.all, "growth"] as const,
};

export function useChoirTotalsQuery(enabled = true) {
  return useQuery({
    queryKey: executiveStewardshipKeys.totals(),
    queryFn: () => getChoirTotals(),
    enabled,
    retry: false,
  });
}

export function useChoirRankingsQuery(enabled = true, limit = 15) {
  return useQuery({
    queryKey: executiveStewardshipKeys.rankings(),
    queryFn: () => getChoirRankings(limit),
    enabled,
    retry: false,
  });
}

export function useRecentAdjustmentsQuery(enabled = true, limit = 15) {
  return useQuery({
    queryKey: executiveStewardshipKeys.adjustments(),
    queryFn: () => getRecentAdjustments(limit),
    enabled,
    retry: false,
  });
}

export function useChoirGrowthQuery(enabled = true) {
  return useQuery({
    queryKey: executiveStewardshipKeys.growth(),
    queryFn: async () => {
      const current = monthRange(0);
      const previous = monthRange(-1);
      const [now, prior] = await Promise.all([
        getChoirTotals(current),
        getChoirTotals(previous),
      ]);
      return {
        contributionsPct: growthPercent(
          now.confirmed.effectiveTotal,
          prior.confirmed.effectiveTotal,
        ),
        contributorsPct: growthPercent(now.confirmed.count, prior.confirmed.count),
        familiesCount: now.byFamily?.length ?? 0,
      };
    },
    enabled,
    retry: false,
  });
}
