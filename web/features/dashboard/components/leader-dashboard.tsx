"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsTable } from "@/components/ui/cmms-table";
import { DashboardStateCard, DashboardStatCard, AttendanceTrendChart, DistributionChart, formatCurrency, formatDateTime, formatPercent } from "@/features/dashboard/components/dashboard-primitives";
import { useLeaderDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-queries";

export function LeaderDashboard() {
  const t = useTranslations("dashboard");
  const query = useLeaderDashboardQuery(true);

  if (query.isLoading) {
    return (
      <DashboardStateCard
        title={t("leaderTitle")}
        message={t("loadingDashboard")}
      />
    );
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
        />
        <DashboardStatCard
          label={t("stats.activeDiscipline")}
          value={data.activeDiscipline}
          description={t("leaderDisciplineHint")}
          tone={data.activeDiscipline > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceTrendChart
          title={t("attendanceTrendTitle")}
          description={t("attendanceTrendDescription")}
          points={data.attendanceTrend}
        />
        <DistributionChart
          title={t("ministryAnalyticsTitle")}
          description={t("ministryAnalyticsDescription")}
          items={data.ministryAnalytics.map((item) => ({
            ...item,
            label: t(`ministries.${item.label.toLowerCase()}`),
          }))}
        />
      </div>

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
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              {t("noUpcomingEvents")}
            </div>
          )}
        </CmmsCard>

        <DistributionChart
          title={t("reliabilityTitle")}
          description={t("reliabilityDescription")}
          items={data.reliabilityBands.map((item) => ({
            ...item,
            label: t(`reliabilityBands.${item.label}`),
          }))}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionChart
          title={t("governance.teamReliabilityTitle")}
          description={t("governance.teamReliabilityDescription")}
          items={data.teamReliability.map((item) => ({
            label: item.label,
            count: item.compatibilityRate,
          }))}
        />
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
      </div>

      <CmmsCard
        title={t("governance.roleWidgetsTitle")}
        description={t("governance.roleWidgetsDescription")}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.permissionWidgets).map(([key, enabled]) => (
            <CmmsBadge key={key} variant={enabled ? "success" : "neutral"}>
              {t(`governance.widgets.${key}`)}
            </CmmsBadge>
          ))}
        </div>
      </CmmsCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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
      </div>
    </div>
  );
}
