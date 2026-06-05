"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { fetchProtocolTeamLeaderDashboard } from "@/features/dashboard/api/leadership-actions-api";
import { ActionCenterShell } from "@/features/dashboard/components/action-centers/action-center-shell";

export function ProtocolTeamLeaderActionCenter() {
  const t = useTranslations("actionCenter.protocolTeamLeader");

  const query = useQuery({
    queryKey: ["action-center", "protocol-team-leader"],
    queryFn: fetchProtocolTeamLeaderDashboard,
  });

  const data = query.data;
  const teams = data?.teams ?? [];
  const pendingReplacements = data?.pendingReplacements ?? [];
  const reports = data?.reports ?? [];

  return (
    <ActionCenterShell
      id="protocol-team-leader-action-center"
      title={t("title")}
      subtitle={t("subtitle")}
      loading={query.isLoading}
      error={query.isError}
      loadingLabel={t("loading")}
      errorLabel={t("error")}
      primaryAction={{ label: t("manageTeams"), href: "/dashboard/protocol/teams" }}
      secondaryAction={{ label: t("replacements"), href: "/dashboard/protocol/replacements" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("myTeams")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{teams.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("pendingReplacements")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {pendingReplacements.length}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("recentReports")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{reports.length}</p>
        </div>
      </div>

      {teams.length > 0 ? (
        <ul className="space-y-2" aria-label={t("myTeams")}>
          {teams.slice(0, 5).map((team) => (
            <li
              key={team.id}
              className="rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
            >
              {team.occurrence?.title ?? t("unnamedTeam")}
              {team.occurrence?.startAt ? (
                <span className="text-[var(--muted-foreground)]">
                  {" "}
                  · {new Date(team.occurrence.startAt).toLocaleDateString()}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">{t("noTeams")}</p>
      )}
    </ActionCenterShell>
  );
}
