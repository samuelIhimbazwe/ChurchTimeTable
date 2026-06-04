"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchChoirReportsSummary, http } from "@/core/api/http";

export function ChoirReportsPage() {
  const t = useTranslations("choirReports");
  const summaryQuery = useQuery({
    queryKey: ["choir", "reports", "summary"],
    queryFn: fetchChoirReportsSummary,
  });
  const data = summaryQuery.data as {
    membership?: { total?: number };
    leadership?: { activeAssignments?: number };
    welfare?: { summary?: { activeCases?: number; totalContributions?: number } };
    music?: { totalSongs?: number };
    rehearsals?: { averageReadiness?: number };
  } | undefined;

  async function download(path: string, filename: string) {
    const response = await http.get(path, { responseType: "blob" });
    const url = URL.createObjectURL(response.data as Blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <OperationalScreen title={t("title")} subtitle={t("subtitle")}>
      <div className="mb-4 flex gap-2">
        <CmmsButton
          variant="secondary"
          onClick={() => void download("/choir/reports/summary.pdf", "choir-reports.pdf")}
        >
          {t("exportPdf")}
        </CmmsButton>
        <CmmsButton
          variant="secondary"
          onClick={() => void download("/choir/reports/summary.csv", "choir-reports.csv")}
        >
          {t("exportCsv")}
        </CmmsButton>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardStateCard
          label={t("members")}
          value={data?.membership?.total ?? 0}
          loading={summaryQuery.isLoading}
        />
        <DashboardStateCard
          label={t("leadership")}
          value={data?.leadership?.activeAssignments ?? 0}
          loading={summaryQuery.isLoading}
        />
        <DashboardStateCard
          label={t("welfareCases")}
          value={data?.welfare?.summary?.activeCases ?? 0}
          loading={summaryQuery.isLoading}
        />
        <DashboardStateCard
          label={t("songs")}
          value={data?.music?.totalSongs ?? 0}
          loading={summaryQuery.isLoading}
        />
        <DashboardStateCard
          label={t("rehearsalReadiness")}
          value={`${data?.rehearsals?.averageReadiness ?? 0}%`}
          loading={summaryQuery.isLoading}
        />
      </div>
      <CmmsCard title={t("sectionsTitle")} className="mt-4">
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>{t("sectionMembership")}</li>
          <li>{t("sectionWelfare")}</li>
          <li>{t("sectionMusic")}</li>
          <li>{t("sectionRehearsals")}</li>
          <li>{t("sectionContributions")}</li>
        </ul>
      </CmmsCard>
    </OperationalScreen>
  );
}
