"use client";

import { useTranslations } from "next-intl";

import { OperationalScreen } from "@/components/ui/operational-screen";
import {
  DashboardStateCard,
  ProgressMeter,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { CampaignProgressList } from "@/features/executive-stewardship/components/CampaignProgressList";
import { NeedsAttentionList } from "@/features/executive-stewardship/components/NeedsAttentionList";
import { RecentAdjustmentsList } from "@/features/executive-stewardship/components/RecentAdjustmentsList";
import { StewardshipMobileNav } from "@/features/executive-stewardship/components/StewardshipMobileNav";
import { StewardshipSection } from "@/features/executive-stewardship/components/StewardshipSection";
import { StewardshipStatGrid } from "@/features/executive-stewardship/components/StewardshipStatGrid";
import { TopContributorsTable } from "@/features/executive-stewardship/components/TopContributorsTable";
import { TopFamiliesTable } from "@/features/executive-stewardship/components/TopFamiliesTable";
import {
  useChoirGrowthQuery,
  useChoirRankingsQuery,
  useChoirTotalsQuery,
  useRecentAdjustmentsQuery,
} from "@/features/executive-stewardship/hooks/use-executive-stewardship-queries";

export function StewardshipHubPage() {
  const t = useTranslations("executiveStewardship.hub");
  const totalsQuery = useChoirTotalsQuery();
  const rankingsQuery = useChoirRankingsQuery();
  const adjustmentsQuery = useRecentAdjustmentsQuery();
  const growthQuery = useChoirGrowthQuery();

  const loading =
    totalsQuery.isLoading || rankingsQuery.isLoading || growthQuery.isLoading;

  if (loading) {
    return (
      <OperationalScreen className="cmms-content-wide pb-24 lg:pb-8">
        <DashboardStateCard title={t("title")} message={t("loading")} />
        <StewardshipMobileNav />
      </OperationalScreen>
    );
  }

  if (totalsQuery.isError || rankingsQuery.isError) {
    return (
      <OperationalScreen className="cmms-content-wide pb-24 lg:pb-8">
        <DashboardStateCard title={t("title")} message={t("loadError")} />
        <StewardshipMobileNav />
      </OperationalScreen>
    );
  }

  const totals = totalsQuery.data!;
  const rankings = rankingsQuery.data!;
  const campaigns = totals.byCampaign.filter((c) =>
    ["ACTIVE", "COMPLETED"].includes(c.status),
  );
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const overallGoal = campaigns.reduce((sum, c) => sum + c.goalAmount, 0);
  const overallCurrent = campaigns.reduce((sum, c) => sum + c.confirmedEffective, 0);
  const overallPct =
    overallGoal > 0
      ? Math.min(100, Math.round((overallCurrent / overallGoal) * 1000) / 10)
      : 0;

  return (
    <OperationalScreen className="cmms-content-wide space-y-6 pb-24 lg:pb-8">
      <header>
        <p className="text-sm text-[var(--muted-foreground)]">{t("eyebrow")}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>
      </header>

      <StewardshipStatGrid
        effectiveTotal={totals.confirmed.effectiveTotal}
        contributorCount={totals.confirmed.count}
        activeCampaignCount={activeCampaigns.length}
        familyCount={totals.byFamily?.length ?? rankings.topFamilies.length}
        contributionsGrowthPct={growthQuery.data?.contributionsPct ?? null}
        contributorsGrowthPct={growthQuery.data?.contributorsPct ?? null}
      />

      {overallGoal > 0 ? (
        <StewardshipSection title={t("overallGoal")}>
          <ProgressMeter
            label={t("overallGoalLabel", {
              current: formatCurrency(overallCurrent),
              goal: formatCurrency(overallGoal),
              pct: formatPercent(overallPct),
            })}
            value={overallPct}
          />
        </StewardshipSection>
      ) : null}

      <StewardshipSection
        title={t("campaignsTitle")}
        viewAllHref="/dashboard/stewardship/campaigns"
        viewAllLabel={t("viewAll")}
      >
        <CampaignProgressList campaigns={totals.byCampaign} compact />
      </StewardshipSection>

      <StewardshipSection
        title={t("familiesTitle")}
        viewAllHref="/dashboard/stewardship/families"
        viewAllLabel={t("viewAll")}
      >
        <TopFamiliesTable families={rankings.topFamilies.slice(0, 5)} />
      </StewardshipSection>

      <StewardshipSection
        title={t("contributorsTitle")}
        viewAllHref="/dashboard/stewardship/contributors"
        viewAllLabel={t("viewAll")}
      >
        <TopContributorsTable contributors={rankings.topContributors.slice(0, 5)} />
      </StewardshipSection>

      <StewardshipSection
        title={t("needsAttentionTitle")}
        viewAllHref="/dashboard/stewardship/needs-attention"
        viewAllLabel={t("viewAll")}
      >
        <NeedsAttentionList items={rankings.needsAttention.slice(0, 3)} />
      </StewardshipSection>

      <StewardshipSection
        title={t("adjustmentsTitle")}
        viewAllHref="/dashboard/stewardship/adjustments"
        viewAllLabel={t("viewAll")}
      >
        <RecentAdjustmentsList items={adjustmentsQuery.data?.items.slice(0, 5) ?? []} />
      </StewardshipSection>

      <StewardshipMobileNav />
    </OperationalScreen>
  );
}
