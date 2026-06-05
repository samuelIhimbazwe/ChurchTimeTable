"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { CmmsBadge } from "@/components/ui/cmms-badge";
import {
  fetchChoirJoinRequestsForReview,
  fetchChoirSchedulingDashboard,
} from "@/features/dashboard/api/leadership-actions-api";
import { ActionCenterShell } from "@/features/dashboard/components/action-centers/action-center-shell";

export function ChoirPresidentActionCenter() {
  const t = useTranslations("actionCenter.choirPresident");

  const joinQuery = useQuery({
    queryKey: ["action-center", "choir-join-requests"],
    queryFn: () => fetchChoirJoinRequestsForReview("PENDING"),
  });

  const schedulingQuery = useQuery({
    queryKey: ["action-center", "choir-scheduling"],
    queryFn: fetchChoirSchedulingDashboard,
  });

  const loading = joinQuery.isLoading || schedulingQuery.isLoading;
  const error = joinQuery.isError || schedulingQuery.isError;
  const pending = joinQuery.data ?? [];
  const scheduling = schedulingQuery.data;

  return (
    <ActionCenterShell
      id="choir-president-action-center"
      title={t("title")}
      subtitle={t("subtitle")}
      loading={loading}
      error={error}
      loadingLabel={t("loading")}
      errorLabel={t("error")}
      primaryAction={
        pending.length > 0
          ? { label: t("reviewRequests"), href: "/membership" }
          : undefined
      }
      secondaryAction={{ label: t("openScheduling"), href: "/dashboard/choir" }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("pendingJoinRequests")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{pending.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("upcomingServices")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {scheduling?.upcomingServices ?? "—"}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] p-3">
          <p className="text-xs text-[var(--muted-foreground)]">{t("upcomingRehearsals")}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {scheduling?.upcomingRehearsals ?? "—"}
          </p>
        </div>
      </div>

      {pending.length > 0 ? (
        <ul className="space-y-2" aria-label={t("pendingJoinRequests")}>
          {pending.slice(0, 5).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span>
                {row.member.firstName} {row.member.lastName}
                <span className="text-[var(--muted-foreground)]"> · {row.choir.name}</span>
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
