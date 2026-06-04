"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import {
  DashboardStateCard,
  ProgressMeter,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { FamilyContextPicker } from "@/features/family-contributions/components/FamilyContextPicker";
import { useFamilyTotalsQuery } from "@/features/family-contributions/hooks/use-family-contribution-queries";
import { useFamilyIdParam } from "@/features/family-contributions/lib/use-family-id-param";
import { useFamilyWorkspace } from "@/features/family-contributions/lib/use-family-workspace";

export function FamilyGoalsPage() {
  const t = useTranslations("familyContributions.goals");
  const workspace = useFamilyWorkspace();
  useFamilyIdParam(workspace.setFamilyId);

  const { families, activeFamilyId, setFamilyId, contextQuery } = workspace;
  const totalsQuery = useFamilyTotalsQuery(activeFamilyId);

  if (contextQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-wide">
        <DashboardStateCard title={t("title")} message={t("loading")} />
      </OperationalScreen>
    );
  }

  const campaigns = totalsQuery.data?.byCampaign ?? [];

  return (
    <OperationalScreen className="cmms-content-wide">
      <p className="text-sm">
        <Link
          href={`/dashboard/family/contributions${activeFamilyId ? `?familyId=${activeFamilyId}` : ""}`}
          className="text-[var(--primary)] hover:underline"
        >
          {t("back")}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("subtitle")}</p>

      <div className="mt-4">
        <FamilyContextPicker families={families} value={activeFamilyId} onChange={setFamilyId} />
      </div>

      {!activeFamilyId ? (
        <CmmsEmptyState className="mt-6" title={t("pickFamily")} />
      ) : totalsQuery.isLoading ? (
        <div className="mt-6">
          <DashboardStateCard title={t("title")} message={t("loading")} />
        </div>
      ) : campaigns.length === 0 ? (
        <CmmsEmptyState className="mt-6" title={t("emptyTitle")} description={t("emptyMessage")} />
      ) : (
        <CmmsCard className="mt-6" title={t("campaignsTitle")}>
          <div className="space-y-6">
            {campaigns.map((campaign) => (
              <ProgressMeter
                key={campaign.campaignId}
                label={`${campaign.name} (${campaign.status})`}
                value={campaign.progressPct}
                description={t("progress", {
                  current: formatCurrency(campaign.confirmedEffective),
                  goal: formatCurrency(campaign.goalAmount),
                  pct: formatPercent(campaign.progressPct),
                })}
              />
            ))}
          </div>
        </CmmsCard>
      )}
    </OperationalScreen>
  );
}
