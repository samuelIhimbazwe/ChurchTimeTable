"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { DashboardStatCard } from "@/features/dashboard/components/dashboard-primitives";
import type { FamilyMetricsPayload } from "@/core/api/http";

export function FamilyHealthCard({
  metrics,
}: Readonly<{ metrics: FamilyMetricsPayload }>) {
  const t = useTranslations("families");

  return (
    <div className="space-y-4">
      <CmmsCard
        title={t("metrics.healthTitle")}
        description={t("metrics.healthDescription")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardStatCard
            label={t("metrics.healthScore")}
            value={metrics.health.score}
            description={`${t("metrics.grade")}: ${metrics.health.grade}`}
            tone="accent"
          />
          <DashboardStatCard
            label={t("metrics.attendanceRate")}
            value={`${metrics.attendance.attendanceRate}%`}
            description={t("metrics.attendanceSummary", {
              present: metrics.attendance.attendanceCount,
              missed: metrics.attendance.missedCount,
            })}
          />
        </div>
      </CmmsCard>

      <div className="grid gap-4 md:grid-cols-3">
        <DashboardStatCard
          label={t("metrics.attendanceTitle")}
          value={metrics.attendance.attendanceCount}
          description={t("metrics.missedCount", {
            count: metrics.attendance.missedCount,
          })}
        />
        {metrics.contributions ? (
          <DashboardStatCard
            label={t("metrics.contributionsTitle")}
            value={metrics.contributions.confirmedAmount.toLocaleString()}
            description={t("metrics.contributionsSummary", {
              pending: metrics.contributions.pendingAmount.toLocaleString(),
              count: metrics.contributions.contributionCount,
            })}
          />
        ) : (
          <DashboardStatCard
            label={t("metrics.contributionsTitle")}
            value="—"
            description={t("metrics.contributionsHidden")}
          />
        )}
        <DashboardStatCard
          label={t("metrics.participationTitle")}
          value={metrics.participation.activeAssignments}
          description={t("metrics.participationSummary", {
            leaders: metrics.participation.activeLeaders,
            members: metrics.participation.activeMembers,
          })}
        />
      </div>
    </div>
  );
}
