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
  ProgressMeter,
  formatCurrency,
  formatDateTime,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { useSessionStore } from "@/core/auth/session-store";
import { useMemberDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-queries";
import { MemberExcusePanel } from "@/features/dashboard/components/member-excuse-panel";
import { DashboardAlertsPanel } from "@/features/dashboard/components/dashboard-alerts-panel";
import { hasWidget } from "@/features/dashboard/hooks/use-dashboard-widgets";

export function MemberDashboard() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("attendance");
  const router = useRouter();
  const profile = useSessionStore((state) => state.profile);
  const query = useMemberDashboardQuery(true);
  const displayName = [profile?.member?.firstName, profile?.member?.lastName]
    .filter(Boolean)
    .join(" ");

  if (query.isLoading) {
    return <CmmsDashboardSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <DashboardStateCard
        title={t("memberTitle")}
        message={t("dashboardLoadError")}
      />
    );
  }

  const data = query.data;
  const widgets = data.widgets;
  const analytics = data.personalAnalytics;

  return (
    <div className="cmms-page-stack">
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-xs)]">
        <p className="cmms-text-display text-[var(--foreground)]">
          {t("welcomeBack", { name: displayName || t("memberTitle") })}
        </p>
      </div>

      {hasWidget(widgets, "alertsPanel") && data.alerts.length > 0 ? (
        <DashboardAlertsPanel alerts={data.alerts} />
      ) : null}

      {hasWidget(widgets, "kpiOverview") ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label={t("stats.upcomingAssignments")}
            value={data.upcomingAssignments}
            description={t("memberUpcomingAssignmentsHint")}
            trend={{ value: t("metricTrendNeutral"), direction: "neutral" }}
            tone="accent"
          />
          <DashboardStatCard
            label={t("stats.pendingSwaps")}
            value={data.pendingSwaps}
            description={t("memberPendingSwapsHint")}
            trend={{ value: t("metricTrendNeutral"), direction: "neutral" }}
          />
          <DashboardStatCard
            label={t("stats.attendanceRate")}
            value={
              data.attendanceScore
                ? `${data.attendanceScore.percentage}% (${data.attendanceScore.bandLabel})`
                : formatPercent(data.attendanceRate)
            }
            description={t("memberAttendanceHint")}
            trend={{ value: t("metricTrendUp", { value: "12" }), direction: "up" }}
          />
          <DashboardStatCard
            label={t("stats.responsibilityScore")}
            value={formatPercent(data.responsibilityScore)}
            description={t("memberResponsibilityHint")}
            trend={{ value: t("metricTrendNeutral"), direction: "neutral" }}
          />
        </div>
      ) : null}

      {hasWidget(widgets, "personalAnalytics") ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardStatCard
            label={t("personal.voluntaryService")}
            value={analytics.voluntaryServiceCount}
          />
          <DashboardStatCard
            label={t("personal.replacements")}
            value={analytics.replacementCount}
          />
          <DashboardStatCard
            label={t("personal.lateness")}
            value={analytics.latenessCount}
            tone={analytics.latenessCount > 2 ? "warning" : "default"}
          />
          <DashboardStatCard
            label={t("personal.contributionCompliance")}
            value={formatPercent(analytics.contributionCompliance)}
          />
        </div>
      ) : null}

      {hasWidget(widgets, "excusePanel") ? (
        <MemberExcusePanel assignments={data.upcomingSchedule} />
      ) : null}

      {(hasWidget(widgets, "schedule") || hasWidget(widgets, "notifications")) ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          {hasWidget(widgets, "schedule") ? (
            <CmmsCard
              title={t("scheduleCardTitle")}
              description={t("scheduleCardDescription")}
            >
              {data.upcomingSchedule.length ? (
                <div className="space-y-3">
                  {data.upcomingSchedule.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--foreground)] break-words">
                            {assignment.event.title}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                            {formatDateTime(assignment.event.startTime)}
                          </p>
                          {assignment.event.location ? (
                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                              {assignment.event.location}
                            </p>
                          ) : null}
                        </div>
                        <CmmsBadge variant="info">
                          {t(`eventStatus.${assignment.event.status.toLowerCase()}`)}
                        </CmmsBadge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <CmmsEmptyState
                  title={t("noScheduleTitle")}
                  description={t("noSchedule")}
                />
              )}
            </CmmsCard>
          ) : null}

          {hasWidget(widgets, "notifications") ? (
            <CmmsCard
              title={t("notificationsTitle")}
              description={t("notificationsDescription")}
            >
              {data.recentNotifications.length ? (
                <div className="space-y-3">
                  {data.recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--foreground)] break-words">
                            {notification.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)] break-words">
                            {notification.body}
                          </p>
                          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                            {formatDateTime(notification.createdAt)}
                          </p>
                        </div>
                        <CmmsBadge variant={notification.read ? "neutral" : "success"}>
                          {notification.read ? t("readLabel") : t("newLabel")}
                        </CmmsBadge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <CmmsEmptyState
                  title={t("noNotificationsTitle")}
                  description={t("noNotifications")}
                />
              )}
            </CmmsCard>
          ) : null}
        </div>
      ) : null}

      {(hasWidget(widgets, "attendanceHistory") || hasWidget(widgets, "contributionProgress")) ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          {hasWidget(widgets, "attendanceHistory") ? (
            <CmmsCard
              title={t("attendanceCardTitle")}
              description={t("attendanceCardDescription")}
            >
              <CmmsTable
                rows={data.attendanceRecent}
                emptyState={t("noAttendanceHistory")}
                columns={[
                  {
                    key: "event",
                    header: t("table.event"),
                    render: (row) => row.event?.title ?? "--",
                  },
                  {
                    key: "status",
                    header: t("table.status"),
                    render: (row) => (
                      <CmmsBadge
                        variant={
                          row.operationalStatus === "ATTENDED" ||
                          row.operationalStatus === "REPLACEMENT_SERVED" ||
                          row.operationalStatus === "VOLUNTARY_EXTRA_SERVICE"
                            ? "success"
                            : row.operationalStatus === "LATE"
                              ? "warning"
                              : row.operationalStatus === "EXCUSED_ABSENCE"
                                ? "info"
                                : "danger"
                        }
                      >
                        {row.operationalStatus
                          ? ta(`status.${row.operationalStatus}`)
                          : t(`attendanceStatus.${row.physicalStatus.toLowerCase()}`)}
                      </CmmsBadge>
                    ),
                  },
                  {
                    key: "when",
                    header: t("table.when"),
                    render: (row) => formatDateTime(row.createdAt),
                  },
                ]}
              />
            </CmmsCard>
          ) : null}

          {hasWidget(widgets, "contributionProgress") ? (
            <CmmsCard
              title={t("contributionTitle")}
              description={t("contributionDescription")}
            >
              <div className="space-y-5">
                {data.contributionProgress.upToDate ? (
                  <p className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                    {t("contributionUpToDate")}
                  </p>
                ) : null}
                <ProgressMeter
                  label={t("contributionProgressLabel")}
                  value={data.contributionProgress.completionRate}
                  description={t("contributionProgressDescription", {
                    paid: data.contributionProgress.paid,
                    total: data.contributionProgress.total,
                  })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <DashboardStatCard
                    label={t("stats.outstandingAmount")}
                    value={formatCurrency(data.contributionProgress.outstandingAmount)}
                    description={t("stats.unpaidPeriods", {
                      count: data.contributionProgress.unpaid,
                    })}
                  />
                  <DashboardStatCard
                    label={t("stats.paidPeriods")}
                    value={data.contributionProgress.paid}
                    description={t("stats.totalPeriods", {
                      count: data.contributionProgress.total,
                    })}
                    tone="accent"
                  />
                </div>
                <div className="space-y-2">
                  {data.contributionProgress.recent.length ? (
                    data.contributionProgress.recent.map((item) => (
                      <div
                        key={item.period}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{item.period}</p>
                          <p className="text-sm text-[var(--muted-foreground)]">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                        <CmmsBadge variant={item.paid ? "success" : "warning"}>
                          {item.paid ? t("paidLabel") : t("pendingLabel")}
                        </CmmsBadge>
                      </div>
                    ))
                  ) : (
                    <CmmsEmptyState
                      title={t("noContributionDataTitle")}
                      description={t("noContributionData")}
                      actionLabel={t("openMyContributions")}
                      onAction={() => router.push("/dashboard/finance/my-contributions")}
                    />
                  )}
                </div>
                <Link
                  href="/dashboard/finance/my-contributions"
                  className="inline-block text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  {t("openMyContributions")}
                </Link>
              </div>
            </CmmsCard>
          ) : null}
        </div>
      ) : null}

      {hasWidget(widgets, "memberHistory") ? (
      <div className="grid gap-6 xl:grid-cols-2">
        <CmmsCard
          title={t("governance.memberHistoryTitle")}
          description={t("governance.memberHistoryDescription")}
        >
          <CmmsTable
            rows={data.history.protocolTeamHistory}
            emptyState={t("governance.noProtocolHistory")}
            columns={[
              {
                key: "serviceType",
                header: t("table.event"),
                render: (row) => `${row.team.serviceType} (${row.team.month}/${row.team.year})`,
              },
              {
                key: "status",
                header: t("table.status"),
                render: (row) => row.team.status,
              },
            ]}
          />
        </CmmsCard>
        <CmmsCard
          title={t("governance.committeeHistoryTitle")}
          description={t("governance.committeeHistoryDescription")}
        >
          <CmmsTable
            rows={data.history.committeeRoleHistory}
            emptyState={t("governance.noCommitteeHistory")}
            columns={[
              { key: "role", header: t("table.status"), render: (row) => row.role.name },
              { key: "assignedAt", header: t("table.when"), render: (row) => formatDateTime(row.assignedAt) },
            ]}
          />
        </CmmsCard>
      </div>
      ) : null}
    </div>
  );
}
