"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/i18n/routing";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchRehearsalDashboard } from "@/core/api/http";

export function RehearsalsPage() {
  const t = useTranslations("rehearsals");

  const dashboardQuery = useQuery({
    queryKey: ["rehearsals", "dashboard"],
    queryFn: fetchRehearsalDashboard,
  });

  const data = dashboardQuery.data;

  return (
    <OperationalScreen title={t("title")} subtitle={t("description")}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/rehearsals/readiness">
          <CmmsButton variant="secondary">{t("readinessNav")}</CmmsButton>
        </Link>
        <Link href="/dashboard/rehearsals/attendance">
          <CmmsButton variant="secondary">{t("attendanceNav")}</CmmsButton>
        </Link>
        <Link href="/dashboard/rehearsals/reports">
          <CmmsButton variant="secondary">{t("reportsTitle")}</CmmsButton>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStateCard
          label={t("attendanceRate")}
          value={`${data?.attendanceRate ?? 0}%`}
          loading={dashboardQuery.isLoading}
        />
        <DashboardStateCard
          label={t("servicePrepScore")}
          value={`${data?.servicePrepScore ?? 0}%`}
          loading={dashboardQuery.isLoading}
        />
        <DashboardStateCard
          label={t("weakSongsCount")}
          value={data?.weakSongs?.length ?? 0}
          loading={dashboardQuery.isLoading}
        />
        <DashboardStateCard
          label={t("upcomingCount")}
          value={data?.upcomingRehearsals?.length ?? 0}
          loading={dashboardQuery.isLoading}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">{t("upcoming")}</h2>
        {dashboardQuery.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(data?.upcomingRehearsals ?? []).map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p>{event.hasPlan ? t("planReady") : t("planMissing")}</p>
                  <p className="text-muted-foreground">
                    {t("readiness", { percent: event.readiness.overall })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(data?.frequentAbsent?.length ?? 0) > 0 ? (
        <section className="mt-4 rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">{t("frequentAbsent")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {data!.frequentAbsent!.map((row) => (
              <li key={row.memberId}>
                {row.name} ({row.count})
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </OperationalScreen>
  );
}
