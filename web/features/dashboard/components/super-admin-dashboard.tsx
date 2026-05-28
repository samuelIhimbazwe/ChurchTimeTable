"use client";

import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsTable } from "@/components/ui/cmms-table";
import {
  DashboardStateCard,
  DashboardStatCard,
  DistributionChart,
  formatDateTime,
} from "@/features/dashboard/components/dashboard-primitives";
import { useAdminDashboardQuery } from "@/features/dashboard/hooks/use-dashboard-queries";
import { useSessionStore } from "@/core/auth/session-store";

export function SuperAdminDashboard({
  showAccessSnapshot = false,
}: Readonly<{
  showAccessSnapshot?: boolean;
}>) {
  const t = useTranslations("dashboard");
  const profile = useSessionStore((state) => state.profile);
  const query = useAdminDashboardQuery(true);

  if (query.isLoading) {
    return (
      <DashboardStateCard
        title={t("superAdminTitle")}
        message={t("loadingDashboard")}
      />
    );
  }

  if (query.isError || !query.data) {
    return (
      <DashboardStateCard
        title={t("superAdminTitle")}
        message={t("dashboardLoadError")}
      />
    );
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStatCard
          label={t("stats.users")}
          value={data.systemStats.users}
          description={t("systemUsersHint")}
          tone="accent"
        />
        <DashboardStatCard
          label={t("stats.members")}
          value={data.systemStats.members}
          description={t("systemMembersHint")}
        />
        <DashboardStatCard
          label={t("stats.events")}
          value={data.systemStats.events}
          description={t("systemEventsHint")}
        />
        <DashboardStatCard
          label={t("stats.auditLogs")}
          value={data.systemStats.auditLogs}
          description={t("systemAuditHint")}
        />
        <DashboardStatCard
          label={t("stats.syncConflicts")}
          value={data.systemStats.syncConflicts}
          description={t("systemSyncHint")}
          tone={data.systemStats.syncConflicts > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <CmmsCard
          title={t("systemHealthTitle")}
          description={t("systemHealthDescription")}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <CmmsBadge
                variant={
                  data.health.status === "healthy" ? "success" : "warning"
                }
              >
                {t(`health.${data.health.status}`)}
              </CmmsBadge>
              <span className="text-sm text-[var(--muted-foreground)]">
                {t("generatedAtLabel", {
                  value: formatDateTime(data.health.generatedAt),
                })}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <DashboardStatCard
                label={t("stats.totalConflicts")}
                value={data.syncDiagnostics.totalConflicts}
              />
              <DashboardStatCard
                label={t("stats.staleConflicts")}
                value={data.syncDiagnostics.staleConflicts}
              />
              <DashboardStatCard
                label={t("stats.myConflicts")}
                value={data.syncDiagnostics.myConflicts}
              />
            </div>
          </div>
        </CmmsCard>

        <DistributionChart
          title={t("roleDistributionTitle")}
          description={t("roleDistributionDescription")}
          items={data.roleDistribution}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardStatCard
          label={t("governance.choirCompatibilityRate")}
          value={`${data.analytics.choirCompatibilityRate}%`}
          description={t("governance.choirCompatibilityDescription")}
          tone="accent"
        />
        <CmmsCard
          title={t("governance.adminAccessTitle")}
          description={t("governance.adminAccessDescription")}
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.permissionWidgets).map(([key, enabled]) => (
              <CmmsBadge key={key} variant={enabled ? "success" : "neutral"}>
                {t(`governance.adminWidgets.${key}`)}
              </CmmsBadge>
            ))}
          </div>
        </CmmsCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DistributionChart
          title={t("auditTrendTitle")}
          description={t("auditTrendDescription")}
          items={data.auditActivityTrend}
        />
        <CmmsCard
          title={t("syncDiagnosticsTitle")}
          description={t("syncDiagnosticsDescription")}
        >
          {data.syncDiagnostics.recentConflicts.length ? (
            <div className="space-y-3">
              {data.syncDiagnostics.recentConflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className="rounded-[var(--radius-xl)] bg-[var(--surface-subtle)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)] break-words">
                        {conflict.entity}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)] break-words">
                        {conflict.reason}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                        {formatDateTime(conflict.createdAt)}
                      </p>
                    </div>
                    <CmmsBadge
                      variant={
                        data.syncDiagnostics.staleConflicts > 0 ? "warning" : "info"
                      }
                    >
                      {conflict.entityId}
                    </CmmsBadge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-xl)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              {t("noSyncConflicts")}
            </div>
          )}
        </CmmsCard>
      </div>

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

      {showAccessSnapshot && profile ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <CmmsCard title={t("rolesTitle")}>
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <CmmsBadge key={role} variant="info">
                  {role}
                </CmmsBadge>
              ))}
            </div>
          </CmmsCard>
          <CmmsCard title={t("permissionsTitle")}>
            <div className="flex flex-wrap gap-2">
              {profile.permissions.map((permission) => (
                <CmmsBadge key={permission} variant="neutral">
                  {permission}
                </CmmsBadge>
              ))}
            </div>
          </CmmsCard>
        </div>
      ) : null}
    </div>
  );
}
