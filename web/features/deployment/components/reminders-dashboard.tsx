"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { CmmsCard } from "@/components/ui/cmms-card";
import { fetchGoLiveReport, fetchRemindersDashboard } from "@/core/api/http";

export function RemindersDashboard() {
  const dashQuery = useQuery({
    queryKey: ["reminders-dashboard"],
    queryFn: fetchRemindersDashboard,
  });
  const reportQuery = useQuery({
    queryKey: ["go-live-report"],
    queryFn: fetchGoLiveReport,
  });

  const dash = dashQuery.data as Record<string, unknown> | undefined;
  const executions = (dash?.executions as Array<Record<string, unknown>>) ?? [];
  const enabledRules = (dash?.enabledRules as Array<Record<string, unknown>>) ?? [];
  const failures = (dash?.failures as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
          GO-LIVE-READY-1
        </p>
        <h1 className="text-2xl font-semibold">Reminder dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Automated rehearsal and event reminders with delivery audit trail.
        </p>
      </header>

      {reportQuery.data ? (
        <CmmsCard>
          <h2 className="font-medium">Go-live readiness</h2>
          <p className="mt-2 text-sm">
            Level: <strong>{String(reportQuery.data.level)}</strong> · Score:{" "}
            {String(reportQuery.data.readinessScore)}%
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {String(reportQuery.data.summary)}
          </p>
        </CmmsCard>
      ) : null}

      <CmmsCard>
        <h2 className="mb-3 font-medium">Enabled rules</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {enabledRules.map((rule) => (
            <li key={String(rule.trigger)} className="rounded border px-3 py-2 text-sm">
              {String(rule.trigger)}
            </li>
          ))}
        </ul>
      </CmmsCard>

      <CmmsCard>
        <h2 className="mb-3 font-medium">Job execution</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="py-2 pr-4">Job</th>
              <th className="py-2 pr-4">Last run</th>
              <th className="py-2 pr-4">Next run</th>
              <th className="py-2 pr-4">Recipients</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((row) => (
              <tr key={String(row.jobKey)} className="border-b">
                <td className="py-2 pr-4">{String(row.jobKey)}</td>
                <td className="py-2 pr-4">
                  {row.lastExecution
                    ? new Date(String(row.lastExecution)).toLocaleString()
                    : "—"}
                </td>
                <td className="py-2 pr-4">
                  {row.nextExecution
                    ? new Date(String(row.nextExecution)).toLocaleString()
                    : "—"}
                </td>
                <td className="py-2 pr-4">{String(row.recipients ?? 0)}</td>
                <td className="py-2">
                  {String(row.status ?? "—")}
                  {row.failureMessage ? (
                    <span className="text-destructive block text-xs">
                      {String(row.failureMessage)}
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CmmsCard>

      <CmmsCard>
        <h2 className="mb-3 font-medium">Recent delivery failures</h2>
        {failures.length === 0 ? (
          <p className="text-muted-foreground text-sm">No failures recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {failures.slice(0, 10).map((f) => (
              <li key={String(f.id)} className="rounded border p-2">
                <span className="font-medium">{String(f.title)}</span>
                <span className="text-muted-foreground block text-xs">
                  {String((f.recipient as { email?: string })?.email ?? f.recipientUserId)} ·{" "}
                  {f.failureReason ? String(f.failureReason) : "Failed"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CmmsCard>

      <Link href="/dashboard/admin/deployment" className="text-primary text-sm underline">
        Deployment center
      </Link>
    </div>
  );
}
