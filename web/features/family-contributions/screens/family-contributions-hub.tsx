"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { Link } from "@/i18n/routing";
import {
  DashboardStatCard,
  DashboardStateCard,
  ProgressMeter,
  formatCurrency,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { FamilyActivityTable } from "@/features/family-contributions/components/FamilyActivityTable";
import { FamilyContextPicker } from "@/features/family-contributions/components/FamilyContextPicker";
import {
  useFamilyInboxQuery,
  useFamilyRankingsQuery,
  useFamilyTotalsQuery,
} from "@/features/family-contributions/hooks/use-family-contribution-queries";
import { useFamilyWorkspace } from "@/features/family-contributions/lib/use-family-workspace";

export function FamilyContributionsHubPage() {
  const t = useTranslations("familyContributions.hub");
  const { contextQuery, families, activeFamilyId, activeFamily, setFamilyId, requiresPicker } =
    useFamilyWorkspace();

  const totalsQuery = useFamilyTotalsQuery(activeFamilyId);
  const pendingQuery = useFamilyInboxQuery(activeFamilyId, "SUBMITTED");
  const activityQuery = useFamilyInboxQuery(activeFamilyId, "CONFIRMED");
  const rankingsQuery = useFamilyRankingsQuery(activeFamilyId);

  if (contextQuery.isLoading) {
    return (
      <OperationalScreen className="cmms-content-wide">
        <DashboardStateCard title={t("title")} message={t("loading")} />
      </OperationalScreen>
    );
  }

  if (contextQuery.isError || families.length === 0) {
    return (
      <OperationalScreen className="cmms-content-wide">
        <CmmsEmptyState title={t("noAccessTitle")} description={t("noAccessMessage")} />
      </OperationalScreen>
    );
  }

  const needsSelection = requiresPicker && !activeFamilyId;

  return (
    <OperationalScreen className="cmms-content-wide">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{t("eyebrow")}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          {activeFamily?.isViewOnly ? (
            <p className="mt-1 text-sm text-[var(--warning)]">{t("viewOnlyBadge")}</p>
          ) : null}
        </div>
        {activeFamily?.canApprove && pendingQuery.data?.pendingCount ? (
          <Link
            href={`/dashboard/family/contributions/pending${activeFamilyId ? `?familyId=${activeFamilyId}` : ""}`}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-[var(--primary-foreground)]"
          >
            {t("pendingCta", { count: pendingQuery.data.pendingCount })}
          </Link>
        ) : null}
      </div>

      <div className="mt-4">
        <FamilyContextPicker
          families={families}
          value={activeFamilyId}
          onChange={setFamilyId}
        />
      </div>

      {needsSelection ? (
        <CmmsEmptyState
          className="mt-6"
          title={t("pickFamilyTitle")}
          description={t("pickFamilyMessage")}
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard
              label={t("stats.confirmed")}
              value={formatCurrency(totalsQuery.data?.confirmed.effectiveTotal ?? 0)}
              tone="accent"
            />
            <DashboardStatCard
              label={t("stats.pending")}
              value={formatCurrency(totalsQuery.data?.pending.claimedTotal ?? 0)}
              tone="warning"
            />
            <DashboardStatCard
              label={t("stats.pendingCount")}
              value={totalsQuery.data?.pending.count ?? 0}
            />
            <DashboardStatCard
              label={t("stats.confirmedCount")}
              value={totalsQuery.data?.confirmed.count ?? 0}
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <CmmsCard title={t("quickLinks")}>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href={`/dashboard/family/contributions/pending?familyId=${activeFamilyId}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {t("linkPending")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/dashboard/family/rankings?familyId=${activeFamilyId}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {t("linkRankings")}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/dashboard/family/goals?familyId=${activeFamilyId}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {t("linkGoals")}
                  </Link>
                </li>
              </ul>
            </CmmsCard>

            <CmmsCard title={t("topContributors")} description={t("topContributorsHint")}>
              {rankingsQuery.data?.topContributors.length ? (
                <ul className="space-y-2">
                  {rankingsQuery.data.topContributors.slice(0, 5).map((row) => (
                    <li
                      key={row.memberId}
                      className="flex justify-between rounded-lg bg-[var(--surface-subtle)] px-3 py-2 text-sm"
                    >
                      <span>{row.memberName}</span>
                      <span className="font-medium">
                        {formatCurrency(row.effectiveTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted-foreground)]">{t("noRankings")}</p>
              )}
              <p className="mt-4">
                <Link
                  href={`/dashboard/family/rankings?familyId=${activeFamilyId}`}
                  className="text-sm text-[var(--primary)] hover:underline"
                >
                  {t("viewAllRankings")}
                </Link>
              </p>
            </CmmsCard>
          </div>

          {totalsQuery.data?.byCampaign.length ? (
            <CmmsCard
              className="mt-6"
              title={t("goalsPreview")}
              description={t("goalsPreviewHint")}
            >
              <div className="space-y-4">
                {totalsQuery.data.byCampaign.slice(0, 3).map((campaign) => (
                  <ProgressMeter
                    key={campaign.campaignId}
                    label={campaign.name}
                    value={campaign.progressPct}
                    description={t("goalProgress", {
                      current: formatCurrency(campaign.confirmedEffective),
                      goal: formatCurrency(campaign.goalAmount),
                      pct: formatPercent(campaign.progressPct),
                    })}
                  />
                ))}
              </div>
            </CmmsCard>
          ) : null}

          <CmmsCard className="mt-6" title={t("recentActivity")}>
            <FamilyActivityTable
              familyId={activeFamilyId!}
              items={activityQuery.data?.items ?? []}
            />
          </CmmsCard>
        </>
      )}
    </OperationalScreen>
  );
}
