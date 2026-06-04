"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { Link } from "@/i18n/routing";
import { canManageWelfare } from "@/core/auth/governance-permissions";
import { useSessionStore } from "@/core/auth/session-store";
import {
  fetchWelfareCases,
  fetchWelfareDashboard,
} from "@/core/api/http";

export function WelfarePage() {
  const t = useTranslations("welfare");
  const profile = useSessionStore((s) => s.profile);
  const canManage = canManageWelfare(profile?.permissions ?? []);

  const dashboardQuery = useQuery({
    queryKey: ["welfare", "dashboard"],
    queryFn: fetchWelfareDashboard,
  });

  const casesQuery = useQuery({
    queryKey: ["welfare", "cases"],
    queryFn: () => fetchWelfareCases(),
  });

  return (
    <OperationalScreen title={t("title")} subtitle={t("description")}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/dashboard/welfare/reports">
          <CmmsButton variant="secondary">{t("reportsTitle")}</CmmsButton>
        </Link>
        {canManage ? (
          <Link href="/dashboard/welfare/new">
            <CmmsButton>{t("createCase")}</CmmsButton>
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStateCard
          label={t("openCases")}
          value={dashboardQuery.data?.openCases ?? 0}
          loading={dashboardQuery.isLoading}
        />
        <DashboardStateCard
          label={t("urgentCases")}
          value={dashboardQuery.data?.urgentCases ?? 0}
          loading={dashboardQuery.isLoading}
        />
        <DashboardStateCard
          label={t("fundsRaised")}
          value={dashboardQuery.data?.fundsRaised ?? 0}
          loading={dashboardQuery.isLoading}
        />
        <DashboardStateCard
          label={t("fundsNeeded")}
          value={dashboardQuery.data?.fundsNeeded ?? 0}
          loading={dashboardQuery.isLoading}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">{t("caseList")}</h2>
        {casesQuery.isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(casesQuery.data?.items ?? []).map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <Link
                  href={`/dashboard/welfare/${item.id}`}
                  className="flex-1 hover:underline"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.member.firstName} {item.member.lastName} · {item.status}
                  </p>
                </Link>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {item.urgency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </OperationalScreen>
  );
}
