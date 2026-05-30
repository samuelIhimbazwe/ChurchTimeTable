"use client";

import { useTranslations } from "next-intl";

import { CmmsCard } from "@/components/ui/cmms-card";
import { DashboardStatCard, formatCurrency, formatPercent } from "@/features/dashboard/components/dashboard-primitives";
import type { LeaderDashboardSummary } from "@/core/api/types";
import { hasWidget } from "@/features/dashboard/hooks/use-dashboard-widgets";

interface CommitteePanelsProps {
  data: LeaderDashboardSummary;
  widgets: Array<{ id: string; category: string; priority: number }>;
}

export function CommitteeDashboardPanels({ data, widgets }: CommitteePanelsProps) {
  const t = useTranslations("dashboard.committee");
  const intel = data.intelligence;

  const panels: Array<{ key: string; widgetId: string; content: React.ReactNode }> = [
    {
      key: "treasurer",
      widgetId: "treasurerPanel",
      content: (
        <CmmsCard title={t("treasurerTitle")} description={t("treasurerDescription")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardStatCard
              label={t("balance")}
              value={formatCurrency(intel.financeAnalytics.balance)}
              tone="accent"
            />
            <DashboardStatCard
              label={t("unpaidMembers")}
              value={intel.financeAnalytics.unpaidMemberCount}
              tone={intel.financeAnalytics.unpaidMemberCount > 0 ? "warning" : "default"}
            />
            <DashboardStatCard
              label={t("complianceRate")}
              value={formatPercent(intel.financeAnalytics.complianceRate)}
            />
          </div>
        </CmmsCard>
      ),
    },
    {
      key: "discipline",
      widgetId: "disciplinePanel",
      content: (
        <CmmsCard title={t("disciplineTitle")} description={t("disciplineDescription")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardStatCard
              label={t("openCases")}
              value={intel.disciplineAnalytics.openCases}
              tone={intel.disciplineAnalytics.openCases > 0 ? "warning" : "default"}
            />
            <DashboardStatCard
              label={t("pastoralReview")}
              value={intel.disciplineAnalytics.pastoralReviewCount}
            />
            <DashboardStatCard
              label={t("repeatedLateness")}
              value={intel.disciplineAnalytics.repeatedLatenessCount}
            />
          </div>
        </CmmsCard>
      ),
    },
    {
      key: "secretary",
      widgetId: "secretaryPanel",
      content: (
        <CmmsCard title={t("secretaryTitle")} description={t("secretaryDescription")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <DashboardStatCard
              label={t("upcomingEvents")}
              value={data.upcomingEvents}
              tone="accent"
            />
            <DashboardStatCard
              label={t("pendingSwaps")}
              value={data.pendingSwaps}
            />
          </div>
        </CmmsCard>
      ),
    },
    {
      key: "operationsManager",
      widgetId: "operationsManagerPanel",
      content: (
        <CmmsCard title={t("operationsTitle")} description={t("operationsDescription")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardStatCard
              label={t("voluntaryService")}
              value={intel.operationalAnalytics.voluntaryContributions}
            />
            <DashboardStatCard
              label={t("choirMarked")}
              value={intel.choirSummary?.totalMarked ?? 0}
            />
            <DashboardStatCard
              label={t("readinessWarnings")}
              value={intel.operationalAnalytics.readinessWarnings}
              tone={intel.operationalAnalytics.readinessWarnings > 0 ? "warning" : "default"}
            />
          </div>
        </CmmsCard>
      ),
    },
    {
      key: "protocolCoordinator",
      widgetId: "protocolCoordinatorPanel",
      content: (
        <CmmsCard title={t("coordinatorTitle")} description={t("coordinatorDescription")}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label={t("activeTeams")}
              value={intel.operationalAnalytics.activeTeams}
            />
            <DashboardStatCard
              label={t("escalatedCases")}
              value={intel.operationalAnalytics.escalatedCount}
              tone={intel.operationalAnalytics.escalatedCount > 0 ? "warning" : "default"}
            />
            <DashboardStatCard
              label={t("overloadAlerts")}
              value={intel.operationalAnalytics.overloadAlerts}
              tone={intel.operationalAnalytics.overloadAlerts > 0 ? "warning" : "default"}
            />
            <DashboardStatCard
              label={t("pendingReplacements")}
              value={intel.operationalAnalytics.pendingReplacements}
            />
          </div>
        </CmmsCard>
      ),
    },
    {
      key: "protocolPresident",
      widgetId: "protocolPresidentPanel",
      content: (
        <CmmsCard title={t("presidentTitle")} description={t("presidentDescription")}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCard
              label={t("ministryHealth")}
              value={`${intel.ministryHealth.score}%`}
              description={t(`healthBand.${intel.ministryHealth.band}`)}
              tone={intel.ministryHealth.band === "attention" ? "warning" : "accent"}
            />
            <DashboardStatCard
              label={t("disciplineRisk")}
              value={intel.operationalAnalytics.disciplineRiskCount}
            />
            <DashboardStatCard
              label={t("workloadImbalance")}
              value={intel.workloadAnalytics.fairnessImbalance ? t("yes") : t("no")}
              tone={intel.workloadAnalytics.fairnessImbalance ? "warning" : "default"}
            />
            <DashboardStatCard
              label={t("overloadedMembers")}
              value={intel.workloadAnalytics.overloadedMembers}
            />
          </div>
        </CmmsCard>
      ),
    },
    {
      key: "choirLeader",
      widgetId: "choirLeaderPanel",
      content: (
        <CmmsCard title={t("choirLeaderTitle")} description={t("choirLeaderDescription")}>
          <div className="grid gap-4 sm:grid-cols-3">
            <DashboardStatCard
              label={t("choirMarked")}
              value={intel.choirSummary?.totalMarked ?? 0}
            />
            <DashboardStatCard
              label={t("choirExcused")}
              value={intel.choirSummary?.excused ?? 0}
            />
            <DashboardStatCard
              label={t("choirUnexcused")}
              value={intel.choirSummary?.unexcused ?? 0}
              tone={(intel.choirSummary?.unexcused ?? 0) > 0 ? "warning" : "default"}
            />
          </div>
        </CmmsCard>
      ),
    },
  ];

  const visible = panels.filter((p) => hasWidget(widgets, p.widgetId));
  if (!visible.length) return null;

  return (
    <div className="cmms-page-stack">
      {visible.map((panel) => (
        <div key={panel.key}>{panel.content}</div>
      ))}
    </div>
  );
}
