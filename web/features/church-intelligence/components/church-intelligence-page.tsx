"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  fetchChurchActivity,
  fetchChurchDashboard,
  fetchChurchHealthSummary,
  fetchChurchReports,
  fetchGovernanceAlerts,
  fetchLeadershipAnalytics,
  fetchMinistryHealthScores,
} from "@/features/church-intelligence/api/church-intelligence-api";

type ChurchTab =
  | "overview"
  | "health"
  | "leadership"
  | "activity"
  | "alerts"
  | "reports";

const TABS: { id: ChurchTab; href: string; label: string }[] = [
  { id: "overview", href: "/dashboard/church", label: "Overview" },
  { id: "health", href: "/dashboard/church/health", label: "Health" },
  {
    id: "leadership",
    href: "/dashboard/church/leadership",
    label: "Leadership",
  },
  { id: "activity", href: "/dashboard/church/activity", label: "Activity" },
  { id: "alerts", href: "/dashboard/church/alerts", label: "Alerts" },
  { id: "reports", href: "/dashboard/church/reports", label: "Reports" },
];

export function ChurchIntelligencePage({ tab }: { tab: ChurchTab }) {
  const summaryQuery = useQuery({
    queryKey: ["church-intelligence", "summary"],
    queryFn: fetchChurchHealthSummary,
    enabled: tab === "overview" || tab === "health",
  });

  const dashboardQuery = useQuery({
    queryKey: ["church-intelligence", "dashboard"],
    queryFn: fetchChurchDashboard,
    enabled: tab === "overview",
  });

  const healthQuery = useQuery({
    queryKey: ["church-intelligence", "ministry-health"],
    queryFn: fetchMinistryHealthScores,
    enabled: tab === "health",
  });

  const alertsQuery = useQuery({
    queryKey: ["church-intelligence", "alerts"],
    queryFn: fetchGovernanceAlerts,
    enabled: tab === "alerts" || tab === "overview",
  });

  const activityQuery = useQuery({
    queryKey: ["church-intelligence", "activity"],
    queryFn: () => fetchChurchActivity(20),
    enabled: tab === "activity" || tab === "overview",
  });

  const leadershipQuery = useQuery({
    queryKey: ["church-intelligence", "leadership"],
    queryFn: fetchLeadershipAnalytics,
    enabled: tab === "leadership",
  });

  const reportsQuery = useQuery({
    queryKey: ["church-intelligence", "reports"],
    queryFn: fetchChurchReports,
    enabled: tab === "reports",
  });

  const summary = summaryQuery.data;

  return (
    <OperationalScreen
      title="Church intelligence"
      description="Governance, health scoring, and leadership analytics"
    >
      <nav className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`rounded border px-2 py-1 ${tab === t.id ? "bg-primary text-primary-foreground" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {(tab === "overview" || tab === "health") && summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStateCard label="Ministries" value={summary.ministryCount} />
          <DashboardStateCard
            label="Active ministries"
            value={summary.activeMinistryCount}
          />
          <DashboardStateCard label="Active members" value={summary.activeMembers} />
          <DashboardStateCard
            label="Meetings (30d)"
            value={summary.meetingsLast30Days}
          />
        </div>
      )}

      {tab === "overview" && (
        <>
          {dashboardQuery.data ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Dashboard bundle loaded — ministry health, alerts, and activity
              widgets available to leadership.
            </p>
          ) : null}
          {alertsQuery.data?.slice(0, 5).map((alert) => (
            <div key={alert.id} className="mb-2 rounded border p-3 text-sm">
              <strong>{alert.title}</strong>
              <p className="text-muted-foreground">{alert.message}</p>
            </div>
          ))}
        </>
      )}

      {tab === "health" &&
        healthQuery.data?.map((row) => (
          <div key={row.ministryId} className="mb-2 rounded border p-3 text-sm">
            <strong>{row.ministryName}</strong> — {row.overallScore} ({row.status})
          </div>
        ))}

      {tab === "leadership" &&
        (leadershipQuery.data as Array<{ memberName: string; activeAssignments: number }>)?.map(
          (row) => (
            <div key={row.memberName} className="mb-2 rounded border p-3 text-sm">
              {row.memberName} — {row.activeAssignments} active role(s)
            </div>
          ),
        )}

      {tab === "activity" &&
        (activityQuery.data as Array<{ id: string; title: string; createdAt: string }>)?.map(
          (row) => (
            <div key={row.id} className="mb-2 rounded border p-3 text-sm">
              {row.title}
              <span className="ml-2 text-muted-foreground">{row.createdAt}</span>
            </div>
          ),
        )}

      {tab === "alerts" &&
        alertsQuery.data?.map((alert) => (
          <div key={alert.id} className="mb-2 rounded border p-3 text-sm">
            <strong>{alert.title}</strong> ({alert.severity})
            <p>{alert.message}</p>
          </div>
        ))}

      {tab === "reports" &&
        (reportsQuery.data as Array<{ id: string; title: string; formats: string[] }>)?.map(
          (row) => (
            <div key={row.id} className="mb-2 rounded border p-3 text-sm">
              {row.title} — {row.formats.join(", ")}
            </div>
          ),
        )}
    </OperationalScreen>
  );
}
