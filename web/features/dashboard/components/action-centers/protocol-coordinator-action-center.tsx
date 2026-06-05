"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import { fetchProtocolClaimsForReview } from "@/features/dashboard/api/leadership-actions-api";
import { fetchProtocolDashboard } from "@/features/protocol/api/protocol-api";
import { ActionCenterShell } from "@/features/dashboard/components/action-centers/action-center-shell";

export function ProtocolCoordinatorActionCenter() {
  const t = useTranslations("actionCenter.protocolCoordinator");

  const dashboardQuery = useQuery({
    queryKey: ["action-center", "protocol-dashboard"],
    queryFn: fetchProtocolDashboard,
  });

  const claimsQuery = useQuery({
    queryKey: ["action-center", "protocol-claims"],
    queryFn: fetchProtocolClaimsForReview,
  });

  const loading = dashboardQuery.isLoading || claimsQuery.isLoading;
  const error = dashboardQuery.isError || claimsQuery.isError;
  const dash = dashboardQuery.data as {
    upcomingTeams?: number;
    pendingReplacements?: number;
    attendanceRate?: number;
    needsFollowUp?: unknown[];
  } | null;
  const claims = claimsQuery.data ?? [];

  return (
    <ActionCenterShell
      id="protocol-coordinator-action-center"
      title={t("title")}
      subtitle={t("subtitle")}
      loading={loading}
      error={error}
      loadingLabel={t("loading")}
      errorLabel={t("error")}
      primaryAction={
        claims.length > 0
          ? { label: t("reviewClaims"), href: "/dashboard/protocol/members" }
          : undefined
      }
      secondaryAction={{ label: t("openProtocol"), href: "/dashboard/protocol" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("pendingClaims")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{claims.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("pendingReplacements")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {dash?.pendingReplacements ?? "—"}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("upcomingTeams")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {dash?.upcomingTeams ?? "—"}
          </p>
        </div>
      </div>

      {claims.length > 0 ? (
        <ul className="space-y-2" aria-label={t("pendingClaims")}>
          {claims.slice(0, 5).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span>
                {row.member
                  ? `${row.member.firstName} ${row.member.lastName}`
                  : t("unknownMember")}
              </span>
              <CmmsBadge variant="warning">{row.status}</CmmsBadge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">{t("nonePending")}</p>
      )}
    </ActionCenterShell>
  );
}
