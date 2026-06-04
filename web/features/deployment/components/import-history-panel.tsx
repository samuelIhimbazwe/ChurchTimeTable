"use client";

import { CmmsCard } from "@/components/ui/cmms-card";

type ImportJobRow = {
  id: string;
  type: string;
  status: string;
  fileName?: string | null;
  createdAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  uploadedBy?: { email?: string };
  results?: {
    appliedCount?: number;
    failedCount?: number;
    warningRows?: unknown[];
  };
  preview?: { summary?: { warnings?: number } };
};

export function ImportHistoryPanel({
  jobs,
  loading,
}: {
  jobs: Array<Record<string, unknown>>;
  loading: boolean;
}) {
  const rows = jobs as unknown as ImportJobRow[];

  return (
    <CmmsCard>
      <h2 className="mb-3 font-medium">Import history</h2>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No imports yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Uploaded by</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Imported</th>
                <th className="py-2">Errors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => {
                const warnings =
                  job.preview?.summary?.warnings ??
                  (job.results as { skippedCount?: number })?.skippedCount ??
                  0;
                return (
                  <tr key={job.id} className="border-b border-muted/50">
                    <td className="py-2 pr-4">{job.type}</td>
                    <td className="py-2 pr-4">{job.uploadedBy?.email ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {new Date(job.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{job.status}</td>
                    <td className="py-2 pr-4">
                      {job.results?.appliedCount ?? "—"}
                    </td>
                    <td className="py-2">
                      {job.errorMessage ??
                        (job.results?.failedCount
                          ? `${job.results.failedCount} failed`
                          : warnings
                            ? `${warnings} warnings`
                            : "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CmmsCard>
  );
}
