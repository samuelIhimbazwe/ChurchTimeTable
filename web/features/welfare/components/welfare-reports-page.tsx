"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { CmmsTable } from "@/components/ui/cmms-table";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchWelfareReports, http } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export function WelfareReportsPage() {
  const t = useTranslations("welfare");
  const reportsQuery = useQuery({
    queryKey: ["welfare", "reports"],
    queryFn: fetchWelfareReports,
  });
  const data = reportsQuery.data;

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
    <OperationalScreen title={t("reportsTitle")} subtitle={t("reportsSubtitle")}>
      <Link href="/dashboard/welfare" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToList")}
      </Link>
      <div className="mb-4 flex flex-wrap gap-2">
        <CmmsButton
          variant="secondary"
          onClick={() => void download("/choir/welfare/reports/summary.pdf", "welfare-reports.pdf")}
        >
          {t("exportPdf")}
        </CmmsButton>
        <CmmsButton
          variant="secondary"
          onClick={() => void download("/choir/welfare/reports/cases.csv", "welfare-cases.csv")}
        >
          {t("exportCsv")}
        </CmmsButton>
      </div>
      {data ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <DashboardStateCard label={t("openCases")} value={data.summary.activeCases} />
            <DashboardStateCard label={t("urgentCases")} value={data.summary.urgentCases} />
            <DashboardStateCard label={t("raised")} value={data.summary.totalContributions} />
            <DashboardStateCard
              label={t("assistanceTotal")}
              value={data.summary.totalAssistance}
            />
            <DashboardStateCard
              label={t("completionRate")}
              value={`${data.summary.completionRate}%`}
            />
          </div>
          <CmmsCard title={t("reportByCategory")}>
            <CmmsTable
              rows={data.byCategory}
              columns={[
                { key: "name", header: t("category"), render: (r) => r.name },
                { key: "caseCount", header: t("cases"), render: (r) => r.caseCount },
                { key: "raised", header: t("raised"), render: (r) => r.raised },
                {
                  key: "distributed",
                  header: t("distributed"),
                  render: (r) => r.distributed,
                },
              ]}
            />
          </CmmsCard>
          <CmmsCard title={t("reportMonthly")}>
            <CmmsTable
              rows={data.monthly}
              columns={[
                { key: "month", header: t("month"), render: (r) => r.month },
                { key: "active", header: t("openCases"), render: (r) => r.activeCases },
                {
                  key: "completed",
                  header: t("completedCases"),
                  render: (r) => r.completedCases,
                },
                { key: "raised", header: t("raised"), render: (r) => r.raised },
              ]}
            />
          </CmmsCard>
        </div>
      ) : null}
    </OperationalScreen>
  );
}
