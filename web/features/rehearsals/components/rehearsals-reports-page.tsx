"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { CmmsButton } from "@/components/ui/cmms-button";
import { CmmsCard } from "@/components/ui/cmms-card";
import { http } from "@/core/api/http";
import { Link } from "@/i18n/routing";

export function RehearsalsReportsPage() {
  const t = useTranslations("rehearsals");

  const query = useQuery({
    queryKey: ["rehearsals", "reports"],
    queryFn: async () => {
      const res = await http.get("/choir/rehearsals/reports");
      return res.data.data as {
        attendanceRate: number;
        attendanceByStatus: Array<{ status: string; _count: number }>;
        sectionPerformance: Array<{ name: string; readiness: number }>;
        readinessTrends: Array<{ title: string; readiness: number }>;
        planCount: number;
      };
    },
  });

  const data = query.data;

  async function exportPdf() {
    const res = await http.get("/choir/rehearsals/reports.pdf", { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rehearsal-reports.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <OperationalScreen title={t("reportsTitle")} subtitle={t("reportsSubtitle")}>
      <Link href="/dashboard/rehearsals" className="mb-4 inline-block text-sm text-primary underline">
        {t("backToRehearsals")}
      </Link>
      <CmmsButton variant="secondary" className="mb-4" onClick={() => void exportPdf()}>
        {t("exportPdf")}
      </CmmsButton>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <CmmsCard title={t("attendanceTrends")}>
            <ul className="space-y-1 text-sm">
              {(data?.attendanceByStatus ?? []).map((row) => (
                <li key={row.status}>
                  {row.status}: {row._count}
                </li>
              ))}
            </ul>
          </CmmsCard>
          <CmmsCard title={t("readinessTrends")}>
            <p className="text-sm">
              {t("attendanceRate")}: {data?.attendanceRate ?? 0}%
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {(data?.readinessTrends ?? []).slice(0, 8).map((row) => (
                <li key={row.title}>
                  {row.title}: {row.readiness}%
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("planCount")}: {data?.planCount ?? 0}
            </p>
          </CmmsCard>
          <CmmsCard title={t("sectionPerformance")} className="md:col-span-2">
            <ul className="space-y-1 text-sm">
              {(data?.sectionPerformance ?? []).map((row) => (
                <li key={row.name}>
                  {row.name}: {row.readiness}%
                </li>
              ))}
            </ul>
          </CmmsCard>
        </div>
      )}
    </OperationalScreen>
  );
}
