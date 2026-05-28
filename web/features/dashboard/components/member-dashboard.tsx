"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsTable } from "@/components/ui/cmms-table";
import {
  DashboardStateCard,
  DashboardStatCard,
  ProgressMeter,
  formatCurrency,
  formatDateTime,
  formatPercent,
} from "@/features/dashboard/components/dashboard-primitives";
import { useMemberDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-queries";

export function MemberDashboard() {
  const t = useTranslations("dashboard");
  const query = useMemberDashboardQuery(true);

  if (query.isLoading) {
    return (
      <DashboardStateCard
        title={t("memberTitle")}
        message={t("loadingDashboard")}
      />
    );
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          label={t("stats.upcomingAssignments")}
          value={data.upcomingAssignments}
          description={t("memberUpcomingAssignmentsHint")}
          tone="accent"
        />
        <DashboardStatCard
          label={t("stats.pendingSwaps")}
          value={data.pendingSwaps}
          description={t("memberPendingSwapsHint")}
        />
        <DashboardStatCard
          label={t("stats.attendanceRate")}
          value={formatPercent(data.attendanceRate)}
          description={t("memberAttendanceHint")}
        />
        <DashboardStatCard
          label={t("stats.responsibilityScore")}
          value={formatPercent(data.responsibilityScore)}
          description={t("memberResponsibilityHint")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
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
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              {t("noSchedule")}
            </div>
          )}
        </CmmsCard>

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
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              {t("noNotifications")}
            </div>
          )}
        </CmmsCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
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
                      row.physicalStatus === "PRESENT"
                        ? "success"
                        : row.physicalStatus === "LATE"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {t(`attendanceStatus.${row.physicalStatus.toLowerCase()}`)}
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

        <CmmsCard
          title={t("contributionTitle")}
          description={t("contributionDescription")}
        >
          <div className="space-y-5">
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
                <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  {t("noContributionData")}
                </div>
              )}
            </div>
          </div>
        </CmmsCard>
      </div>

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

      <CmmsCard
        title={t("governance.memberAccessTitle")}
        description={t("governance.memberAccessDescription")}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.permissionWidgets).map(([key, enabled]) => (
            <CmmsBadge key={key} variant={enabled ? "success" : "neutral"}>
              {t(`governance.memberWidgets.${key}`)}
            </CmmsBadge>
          ))}
        </div>
      </CmmsCard>
    </div>
  );
}
