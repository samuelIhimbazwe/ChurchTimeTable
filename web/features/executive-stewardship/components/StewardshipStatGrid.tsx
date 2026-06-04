"use client";

import { useTranslations } from "next-intl";

import {
  DashboardStatCard,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";

export function StewardshipStatGrid({
  effectiveTotal,
  contributorCount,
  activeCampaignCount,
  familyCount,
  contributionsGrowthPct,
  contributorsGrowthPct,
}: Readonly<{
  effectiveTotal: number;
  contributorCount: number;
  activeCampaignCount: number;
  familyCount: number;
  contributionsGrowthPct: number | null;
  contributorsGrowthPct: number | null;
}>) {
  const t = useTranslations("executiveStewardship.stats");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <DashboardStatCard
        label={t("totalContributions")}
        value={formatCurrency(effectiveTotal)}
        trend={
          contributionsGrowthPct != null
            ? {
                value: t("growthHint", { pct: formatPercent(contributionsGrowthPct) }),
                direction: contributionsGrowthPct >= 0 ? "up" : "down",
              }
            : undefined
        }
        tone="accent"
      />
      <DashboardStatCard
        label={t("totalContributors")}
        value={String(contributorCount)}
        trend={
          contributorsGrowthPct != null
            ? {
                value: t("growthHint", { pct: formatPercent(contributorsGrowthPct) }),
                direction: contributorsGrowthPct >= 0 ? "up" : "down",
              }
            : undefined
        }
      />
      <DashboardStatCard
        label={t("activeCampaigns")}
        value={String(activeCampaignCount)}
      />
      <DashboardStatCard label={t("families")} value={String(familyCount)} />
    </div>
  );
}
