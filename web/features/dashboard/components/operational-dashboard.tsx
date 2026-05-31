"use client";

import { useTranslations } from "next-intl";

import { CmmsDashboardSkeleton } from "@/components/ui/cmms-skeleton";
import { OperationalScreen } from "@/components/ui/operational-screen";
import { cmmsButtonStyles } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import {
  resolveOperationalDashboardRole,
} from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import { Link } from "@/i18n/routing";
import {
  DashboardStateCard,
  DashboardStatCard,
} from "@/features/dashboard/components/dashboard-primitives";
import { useOperationalDashboardQuery } from "@/features/dashboard/hooks/use-operational-dashboard";

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function arr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function OperationalDashboard() {
  const t = useTranslations("operational");
  const profile = useSessionStore((state) => state.profile);
  const perms = profile?.permissions ?? [];
  const role = resolveOperationalDashboardRole(perms);
  const query = useOperationalDashboardQuery(role);

  if (!role) {
    return (
      <DashboardStateCard
        title={t("title")}
        message={t("unauthorized")}
      />
    );
  }

  if (query.isLoading) {
    return <CmmsDashboardSkeleton />;
  }

  if (query.isError || !query.data) {
    return (
      <DashboardStateCard title={t("title")} message={t("loadError")} />
    );
  }

  const data = query.data;
  const roleLabel = t(`roles.${role}`);

  return (
    <OperationalScreen
      subtitle={t("subtitle", { role: roleLabel })}
    >
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/dashboard/attendance"
          className={cmmsButtonStyles({ variant: "secondary" })}
        >
          {t("openAttendance")}
        </Link>
        {(role === "president" || role === "coordinator") ? (
          <Link
            href="/dashboard/coverage"
            className={cmmsButtonStyles({ variant: "secondary" })}
          >
            {t("openCoverage")}
          </Link>
        ) : null}
      </div>

      {role === "president" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard
            label={t("stats.activeTeams")}
            value={num(data.activeTeams)}
          />
          <DashboardStatCard
            label={t("stats.escalated")}
            value={num(data.escalatedCount)}
          />
          <DashboardStatCard
            label={t("stats.pendingReplacements")}
            value={num(data.pendingReplacements)}
          />
          <DashboardStatCard
            label={t("stats.disciplineRisk")}
            value={num(data.disciplineRiskCount)}
          />
        </div>
      ) : null}

      {role === "coordinator" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard
            label={t("stats.activeTeams")}
            value={num(data.activeTeams)}
          />
          <DashboardStatCard
            label={t("stats.escalated")}
            value={arr(data.escalated).length}
          />
          <DashboardStatCard
            label={t("stats.readinessWarnings")}
            value={num(data.readinessWarnings)}
          />
          <DashboardStatCard
            label={t("stats.pendingReplacements")}
            value={num(data.pendingReplacements)}
          />
        </div>
      ) : null}

      {role === "team-head" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardStatCard
            label={t("stats.teams")}
            value={arr(data.teams).length}
          />
          <DashboardStatCard
            label={t("stats.escalated")}
            value={arr(data.escalations).length}
          />
          <DashboardStatCard
            label={t("stats.pendingAbsences")}
            value={arr(data.pendingAbsences).length}
          />
        </div>
      ) : null}

      {role === "choir-leader" ? (
        <CmmsCard title={t("choirSummaryTitle")} description={t("choirSummaryHint")}>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("choirUseAttendance")}
          </p>
        </CmmsCard>
      ) : null}

      <CmmsCard title={t("detailTitle")} description={t("detailHint")}>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/attendance"
            className={cmmsButtonStyles({ variant: "primary" })}
          >
            {t("openAttendance")}
          </Link>
          {(role === "coordinator" || role === "president" || role === "team-head") && (
            <Link
              href="/dashboard/coverage"
              className={cmmsButtonStyles({ variant: "secondary" })}
            >
              {t("openCoverage")}
            </Link>
          )}
        </div>
      </CmmsCard>
    </OperationalScreen>
  );
}
