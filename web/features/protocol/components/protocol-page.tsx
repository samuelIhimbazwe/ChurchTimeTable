"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { LeadershipActionCenters } from "@/features/dashboard/components/action-centers/leadership-action-centers";
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

const TAB_IDS: ProtocolTab[] = [
  "overview",
  "teams",
  "attendance",
  "replacements",
  "rankings",
  "reports",
  "members",
];

const TAB_HREFS: Record<ProtocolTab, string> = {
  overview: "/dashboard/protocol",
  teams: "/dashboard/protocol/teams",
  attendance: "/dashboard/protocol/attendance",
  replacements: "/dashboard/protocol/replacements",
  rankings: "/dashboard/protocol/rankings",
  reports: "/dashboard/protocol/reports",
  members: "/dashboard/protocol/members",
};

export function ProtocolPage({ tab }: { tab: ProtocolTab }) {
  const t = useTranslations("protocolOps");
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
    <OperationalScreen title={t("title")} description={t("description")}>
      <nav
        className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground"
        aria-label={t("title")}
      >
        {TAB_IDS.map((id) => (
          <Link
            key={id}
            href={TAB_HREFS[id]}
            className={`rounded border px-2 py-1 ${tab === id ? "bg-primary text-primary-foreground" : ""}`}
            aria-current={tab === id ? "page" : undefined}
          >
            {t(`tabs.${id}`)}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="mb-6 space-y-6">
          <LeadershipActionCenters showChoirPresident={false} />
          {dash ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="rounded border p-3">
                {t("stats.upcomingTeams")}: {dash.upcomingTeams}
              </div>
              <div className="rounded border p-3">
                {t("stats.pendingReplacements")}: {dash.pendingReplacements}
              </div>
              <div className="rounded border p-3">
                {t("stats.attendanceRate")}: {dash.attendanceRate}%
              </div>
              <div className="rounded border p-3">
                {t("stats.followUp")}: {dash.needsFollowUp?.length ?? 0}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "teams" && (
        <ul className="space-y-2 text-sm">
          {(teamsQuery.data as Array<{ id: string; occurrence: { title: string; startAt: string }; status: string; members: unknown[] }> | undefined)?.map((team) => (
            <li key={team.id} className="rounded border p-3">
              {team.occurrence.title} — {new Date(team.occurrence.startAt).toLocaleString()} —{" "}
              {team.status} ({team.members.length} members)
            </li>
          ))}
        </ul>
      )}

      {tab === "attendance" && (
        <p className="text-sm text-muted-foreground">
          {t("attendanceHint")} {t("teamsLoaded")}:{" "}
          {(teamsQuery.data as unknown[] | undefined)?.length ?? 0}
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

      {tab === "reports" && settingsQuery.data != null ? (
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
      ) : null}

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
