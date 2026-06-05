"use client";

import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/routing";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsEmptyState } from "@/components/ui/cmms-empty-state";
import { CmmsTable } from "@/components/ui/cmms-table";
import {
  DashboardStateCard,
  DashboardStatCard,
  AttendanceTrendChart,
  DistributionChart,
  formatCurrency,
  formatDateTime,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { DashboardAlertsPanel } from "@/features/dashboard/components/dashboard-alerts-panel";
import { CommitteeDashboardPanels } from "@/features/dashboard/components/committee-dashboard-panels";
import {
  MinistryHealthBadge,
  MinistryIntelligencePanel,
} from "@/features/dashboard/components/ministry-intelligence-panel";
import { hasWidget } from "@/features/dashboard/hooks/use-dashboard-widgets";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { CmmsPageSection } from "@/components/ui/cmms-page-section";
import { useLeaderDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-queries";
import { LeadershipActionCenters } from "@/features/dashboard/components/action-centers/leadership-action-centers";
import type { ChartPoint } from "@/core/api/types";

function attendanceRateTrend(
  points: ChartPoint[] | undefined,
  t: (key: string, values?: Record<string, string | number>) => string,
): { value: string; direction: "up" | "down" | "neutral" } | undefined {
  if (!points?.length || points.length < 2) return undefined;
  const withData = points.filter((p) => (p.total ?? 0) > 0);
  if (withData.length < 2) return undefined;
  const prev = withData[withData.length - 2];
  const latest = withData[withData.length - 1];
  const prevPresent = prev.present ?? 0;
  const latestPresent = latest.present ?? 0;
  const prevTotal = prev.total ?? 0;
  const latestTotal = latest.total ?? 0;
  const prevRate = Math.round((prevPresent / prevTotal) * 100);
  const latestRate = Math.round((latestPresent / latestTotal) * 100);
  const delta = latestRate - prevRate;
  if (delta === 0) {
    return { value: t("metricTrendNeutral"), direction: "neutral" };
  }
  return {
    value: t(delta > 0 ? "metricTrendUp" : "metricTrendDown", {
      value: String(Math.abs(delta)),
    }),
    direction: delta > 0 ? "up" : "down",
  };
}

export function LeaderDashboard() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const query = useLeaderDashboardQuery(true);

  if (query.isLoading) {
    return <CmmsDashboardSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <DashboardStateCard
        title={t("leaderTitle")}
        message={t("dashboardLoadError")}
      />
    );
  }

  const data = query.data;
  const widgets = data.widgets;
  const attendanceTrend = attendanceRateTrend(data.attendanceTrend, t);

  return (
    <div className="cmms-page-stack">
      <LeadershipActionCenters />

      {hasWidget(widgets, "alertsPanel") && data.alerts.length > 0 ? (
        <DashboardAlertsPanel alerts={data.alerts} />
      ) : null}

      {hasWidget(widgets, "kpiOverview") ? (
        <CmmsPageSection title={t("overviewSectionTitle")} description={t("overviewSectionHint")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashboardStatCard
            label={t("stats.upcomingEvents")}
            value={data.upcomingEvents}
            description={t("leaderUpcomingEventsHint")}
            tone="accent"
          />
          <DashboardStatCard
            label={t("stats.pendingSwaps")}
            value={data.pendingSwaps}
            description={t("leaderPendingSwapsHint")}
          />
          <DashboardStatCard
            label={t("stats.pendingReplacements")}
            value={data.pendingReplacements}
            description={t("leaderPendingReplacementsHint")}
          />
          <DashboardStatCard
            label={t("stats.attendanceRate")}
            value={formatPercent(data.attendanceRate)}
            description={t("leaderAttendanceHint")}
            trend={attendanceTrend}
          />
          {data.activeDiscipline != null ? (
            <DashboardStatCard
              label={t("stats.activeDiscipline")}
              value={data.activeDiscipline}
              description={t("leaderDisciplineHint")}
              tone={data.activeDiscipline > 0 ? "warning" : "default"}
            />
          ) : null}
        </div>
        </CmmsPageSection>
      ) : null}

      {hasWidget(widgets, "ministryIntelligence") ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <MinistryIntelligencePanel items={data.ministryAnalytics} />
          <MinistryHealthBadge
            score={data.intelligence.ministryHealth.score}
            band={data.intelligence.ministryHealth.band}
          />
        </div>
      ) : null}

      {(hasWidget(widgets, "attendanceTrend") || hasWidget(widgets, "reliabilityBands")) ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {hasWidget(widgets, "attendanceTrend") ? (
            <AttendanceTrendChart
              title={t("attendanceTrendTitle")}
              description={t("attendanceTrendDescription")}
              points={data.attendanceTrend}
            />
          ) : null}
          {hasWidget(widgets, "reliabilityBands") ? (
            <DistributionChart
              title={t("reliabilityTitle")}
              description={t("reliabilityDescription")}
              items={data.reliabilityBands.map((item) => ({
                ...item,
                label: t(`reliabilityBands.${item.label}`),
              }))}
            />
          ) : null}
        </div>
      ) : null}

      {hasWidget(widgets, "upcomingEvents") ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <CmmsCard
            title={t("upcomingEventsCardTitle")}
            description={t("upcomingEventsCardDescription")}
          >
            {data.upcomingEventList.length ? (
              <div className="space-y-3">
                {data.upcomingEventList.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--foreground)] break-words">
                          {event.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {formatDateTime(event.startTime)}
                        </p>
                        {event.location ? (
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {event.location}
                          </p>
                        ) : null}
                      </div>
                      <CmmsBadge variant="info">
                        {t(`ministries.${String(event.ministryScope ?? "both").toLowerCase()}`)}
                      </CmmsBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CmmsEmptyState
                title={t("noUpcomingEventsTitle")}
                description={t("noUpcomingEvents")}
                actionLabel={t("openEventsWorkspace")}
                onAction={() => router.push("/dashboard/events")}
              />
            )}
          </CmmsCard>

          {hasWidget(widgets, "reliabilityBands") ? (
            <DistributionChart
              title={t("ministryAnalyticsTitle")}
              description={t("ministryAnalyticsDescription")}
              items={data.ministryAnalytics.map((item) => ({
                label: item.label,
                count: item.count,
              }))}
            />
          ) : null}
        </div>
      ) : null}

      {(hasWidget(widgets, "teamReliability") || hasWidget(widgets, "replacementMix")) ? (
        <div className="grid gap-6 xl:grid-cols-2">
          {hasWidget(widgets, "teamReliability") ? (
            <DistributionChart
              title={t("governance.teamReliabilityTitle")}
              description={t("governance.teamReliabilityDescription")}
              items={data.teamReliability.map((item) => ({
                label: item.label,
                count: item.compatibilityRate,
              }))}
            />
          ) : null}
          {hasWidget(widgets, "replacementMix") ? (
            <CmmsCard
              title={t("governance.replacementMixTitle")}
              description={t("governance.replacementMixDescription")}
            >
              <CmmsTable
                rows={data.replacementFrequency}
                emptyState={t("governance.noReplacementData")}
                columns={[
                  { key: "label", header: t("table.when"), render: (row) => row.label },
                  { key: "official", header: t("governance.official"), render: (row) => row.official },
                  { key: "voluntary", header: t("governance.voluntary"), render: (row) => row.voluntary },
                ]}
              />
            </CmmsCard>
          ) : null}
        </div>
      ) : null}

      <CommitteeDashboardPanels data={data} widgets={widgets} />

      {hasWidget(widgets, "financeStewardshipPanel") ? (
        <CmmsCard
          title={t("financeStewardshipCardTitle")}
          description={t("financeStewardshipCardDescription")}
        >
          <Link
            href="/dashboard/finance"
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            {t("openFinanceStewardship")}
          </Link>
        </CmmsCard>
      ) : null}

      {(hasWidget(widgets, "financeSnapshot") || hasWidget(widgets, "auditActivity")) ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {hasWidget(widgets, "financeSnapshot") && data.financeSummary ? (
            <CmmsCard title={t("financeCardTitle")} description={t("financeCardDescription")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <DashboardStatCard
                  label={t("stats.balance")}
                  value={formatCurrency(data.financeSummary.balance)}
                  description={t("statsFromTransactions", {
                    count: data.financeSummary.count,
                  })}
                  tone="accent"
                />
                <DashboardStatCard
                  label={t("stats.syncConflicts")}
                  value={data.syncConflicts}
                  description={t("leaderSyncHint")}
                  tone={data.syncConflicts > 0 ? "warning" : "default"}
                />
              </div>
            </CmmsCard>
          ) : null}

          {hasWidget(widgets, "auditActivity") && data.recentAudit?.length ? (
            <CmmsCard title={t("auditCardTitle")} description={t("auditCardDescription")}>
              <CmmsTable
                rows={data.recentAudit}
                emptyState={t("noAuditActivity")}
                columns={[
                  {
                    key: "action",
                    header: t("table.action"),
                    render: (row) => (
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{row.action}</p>
                        <p className="text-sm text-[var(--muted-foreground)]">{row.entity}</p>
                      </div>
                    ),
                  },
                  {
                    key: "user",
                    header: t("table.actor"),
                    render: (row) => row.user?.email ?? "--",
                  },
                  {
                    key: "createdAt",
                    header: t("table.when"),
                    render: (row) => formatDateTime(row.createdAt),
                  },
                ]}
              />
            </CmmsCard>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
