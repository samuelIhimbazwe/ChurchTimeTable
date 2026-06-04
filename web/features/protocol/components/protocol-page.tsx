"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import {
  fetchProtocolDashboard,
  fetchProtocolMembers,
  fetchProtocolReplacements,
  fetchProtocolTeams,
  fetchProtocolRankings,
  fetchProtocolSettings,
} from "@/features/protocol/api/protocol-api";

type ProtocolTab =
  | "overview"
  | "teams"
  | "attendance"
  | "replacements"
  | "rankings"
  | "reports"
  | "members";

const TABS: { id: ProtocolTab; href: string; label: string }[] = [
  { id: "overview", href: "/dashboard/protocol", label: "Overview" },
  { id: "teams", href: "/dashboard/protocol/teams", label: "Teams" },
  { id: "attendance", href: "/dashboard/protocol/attendance", label: "Attendance" },
  { id: "replacements", href: "/dashboard/protocol/replacements", label: "Replacements" },
  { id: "rankings", href: "/dashboard/protocol/rankings", label: "Rankings" },
  { id: "reports", href: "/dashboard/protocol/reports", label: "Reports" },
  { id: "members", href: "/dashboard/protocol/members", label: "Members" },
];

export function ProtocolPage({ tab }: { tab: ProtocolTab }) {
  const now = new Date();
  const dashboardQuery = useQuery({
    queryKey: ["protocol", "dashboard"],
    queryFn: fetchProtocolDashboard,
    enabled: tab === "overview",
  });
  const teamsQuery = useQuery({
    queryKey: ["protocol", "teams"],
    queryFn: () => fetchProtocolTeams(),
    enabled: tab === "teams" || tab === "attendance" || tab === "overview",
  });
  const membersQuery = useQuery({
    queryKey: ["protocol", "members"],
    queryFn: fetchProtocolMembers,
    enabled: tab === "members",
  });
  const replacementsQuery = useQuery({
    queryKey: ["protocol", "replacements"],
    queryFn: fetchProtocolReplacements,
    enabled: tab === "replacements" || tab === "overview",
  });
  const rankingsQuery = useQuery({
    queryKey: ["protocol", "rankings", now.getFullYear(), now.getMonth() + 1],
    queryFn: () =>
      fetchProtocolRankings(now.getFullYear(), now.getMonth() + 1),
    enabled: tab === "rankings" || tab === "overview",
  });
  const settingsQuery = useQuery({
    queryKey: ["protocol", "settings"],
    queryFn: fetchProtocolSettings,
    enabled: tab === "reports",
  });

  const dash = dashboardQuery.data as {
    upcomingTeams?: number;
    pendingReplacements?: number;
    attendanceRate?: number;
    mostActive?: Array<{ member: { firstName: string; lastName: string } }>;
    needsFollowUp?: unknown[];
  } | null;

  return (
    <OperationalScreen
      title="Protocol operations"
      description="Temporary service teams, attendance, replacements, and performance (PROTOCOL-1)"
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

      {tab === "overview" && dash && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded border p-3">Upcoming teams: {dash.upcomingTeams}</div>
          <div className="rounded border p-3">
            Pending replacements: {dash.pendingReplacements}
          </div>
          <div className="rounded border p-3">
            Attendance rate: {dash.attendanceRate}%
          </div>
          <div className="rounded border p-3">
            Follow-up: {dash.needsFollowUp?.length ?? 0}
          </div>
        </div>
      )}

      {tab === "teams" && (
        <ul className="space-y-2 text-sm">
          {(teamsQuery.data as Array<{ id: string; occurrence: { title: string; startAt: string }; status: string; members: unknown[] }> | undefined)?.map((t) => (
            <li key={t.id} className="rounded border p-3">
              {t.occurrence.title} — {new Date(t.occurrence.startAt).toLocaleString()} —{" "}
              {t.status} ({t.members.length} members)
            </li>
          ))}
        </ul>
      )}

      {tab === "attendance" && (
        <p className="text-sm text-muted-foreground">
          Select a published team from Teams, then record outcomes via the API or mobile app.
          Teams loaded: {(teamsQuery.data as unknown[] | undefined)?.length ?? 0}
        </p>
      )}

      {tab === "replacements" && (
        <ul className="space-y-2 text-sm">
          {(replacementsQuery.data as Array<{ id: string; status: string; reason?: string }> | undefined)?.map((r) => (
            <li key={r.id} className="rounded border p-3">
              {r.status}: {r.reason ?? "—"}
            </li>
          ))}
        </ul>
      )}

      {tab === "rankings" && (
        <ul className="space-y-2 text-sm">
          {(rankingsQuery.data as Array<{ rank: number; member: { firstName: string; lastName: string }; gradeScore: number }> | undefined)?.map((r) => (
            <li key={r.rank} className="rounded border p-3">
              #{r.rank} {r.member.firstName} {r.member.lastName} — score {r.gradeScore}
            </li>
          ))}
        </ul>
      )}

      {tab === "reports" && settingsQuery.data && (
        <div className="space-y-2 text-sm">
          <p>Export CSV reports from the API:</p>
          <code className="block rounded border p-2 text-xs">
            GET /api/v1/protocol/reports/monthly-service/export?year={now.getFullYear()}&month=
            {now.getMonth() + 1}
          </code>
          <code className="block rounded border p-2 text-xs">
            GET /api/v1/protocol/reports/reliability/export
          </code>
        </div>
      )}

      {tab === "members" && (
        <ul className="space-y-2 text-sm">
          {(membersQuery.data as Array<{ member: { firstName: string; lastName: string }; totalServicesMonth: number; currentRank?: number }> | undefined)?.map((m, i) => (
            <li key={i} className="rounded border p-3">
              {m.member.firstName} {m.member.lastName} — services: {m.totalServicesMonth}
              {m.currentRank ? ` — rank #${m.currentRank}` : ""}
            </li>
          ))}
        </ul>
      )}
    </OperationalScreen>
  );
}
