"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistryReportSummary } from "@/features/ministry-services/api/ministry-services-api";
import { MinistryServicesShell } from "@/features/ministry-services/components/ministry-services-shell";
import { http } from "@/core/api/http";

export function MinistryReportsPage({ ministryId }: { ministryId: string }) {
  const query = useQuery({
    queryKey: ["ministries", ministryId, "reports", "summary"],
    queryFn: () => fetchMinistryReportSummary(ministryId),
  });

  const download = async (format: "csv" | "pdf") => {
    const res = await http.get(`/ministries/${ministryId}/reports/${format}`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], {
      type: format === "pdf" ? "application/pdf" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `ministry-report.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MinistryServicesShell ministryId={ministryId} active="reports" title="Reports">
      {query.isLoading && <DashboardStateCard variant="loading" message="Loading summary…" />}
      {query.isError && <DashboardStateCard variant="error" message="Could not load report." />}
      {query.data && (
        <div className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            {Object.entries({
              members: query.data.metrics.members,
              operationalUnits: query.data.metrics.operationalUnits,
              leaders: query.data.metrics.leaders,
              announcements: query.data.metrics.announcements,
              documents: query.data.metrics.documents,
              meetings: query.data.metrics.meetings,
              newMembers30d: query.data.metrics.growthMetrics.newMembersLast30Days,
            }).map(([key, value]) => (
              <div key={key} className="rounded-lg border p-3">
                <dt className="text-xs uppercase text-muted-foreground">{key}</dt>
                <dd className="text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => download("csv")}
            >
              Export CSV
            </button>
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm"
              onClick={() => download("pdf")}
            >
              Export PDF
            </button>
          </div>
        </div>
      )}
    </MinistryServicesShell>
  );
}
