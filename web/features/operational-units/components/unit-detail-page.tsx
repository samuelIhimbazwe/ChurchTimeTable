"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  fetchOperationalUnit,
  fetchOperationalUnitActivity,
  fetchOperationalUnitLeadership,
  fetchOperationalUnitMembers,
  fetchOperationalUnitPermissions,
  fetchOperationalUnitSettings,
  fetchOperationalUnitSummary,
  updateOperationalUnitSettings,
} from "@/features/operational-units/api/operational-units-api";
import type { OperationalUnitTab } from "@/features/operational-units/types";
import { getApiErrorMessage } from "@/core/api/http";
import { hasPermission } from "@/core/auth/rbac";
import { useSessionStore } from "@/core/auth/session-store";

const TABS: OperationalUnitTab[] = [
  "overview",
  "members",
  "leadership",
  "permissions",
  "settings",
  "activity",
];

export function UnitDetailPage({ unitId }: { unitId: string }) {
  const profile = useSessionStore((s) => s.profile);
  const canManage = hasPermission(profile, [
    "operational_unit.manage",
    "operational_unit.settings.manage",
  ]);
  const [tab, setTab] = useState<OperationalUnitTab>("overview");

  const unitQuery = useQuery({
    queryKey: ["operational-units", unitId],
    queryFn: () => fetchOperationalUnit(unitId),
  });

  const summaryQuery = useQuery({
    queryKey: ["operational-units", unitId, "summary"],
    queryFn: () => fetchOperationalUnitSummary(unitId),
    enabled: tab === "overview",
  });

  const membersQuery = useQuery({
    queryKey: ["operational-units", unitId, "members"],
    queryFn: () => fetchOperationalUnitMembers(unitId),
    enabled: tab === "members",
  });

  const leadershipQuery = useQuery({
    queryKey: ["operational-units", unitId, "leadership"],
    queryFn: () => fetchOperationalUnitLeadership(unitId),
    enabled: tab === "leadership",
  });

  const permissionsQuery = useQuery({
    queryKey: ["operational-units", unitId, "permissions"],
    queryFn: () => fetchOperationalUnitPermissions(unitId),
    enabled: tab === "permissions",
  });

  const settingsQuery = useQuery({
    queryKey: ["operational-units", unitId, "settings"],
    queryFn: () => fetchOperationalUnitSettings(unitId),
    enabled: tab === "settings",
  });

  const activityQuery = useQuery({
    queryKey: ["operational-units", unitId, "activity"],
    queryFn: () => fetchOperationalUnitActivity(unitId),
    enabled: tab === "activity",
  });

  const settingsMutation = useMutation({
    mutationFn: (input: Record<string, boolean>) =>
      updateOperationalUnitSettings(unitId, input),
    onSuccess: () => settingsQuery.refetch(),
  });

  const unit = unitQuery.data;
  const settings = settingsQuery.data;

  if (unitQuery.isLoading) {
    return <DashboardStateCard>Loading unit…</DashboardStateCard>;
  }
  if (!unit) {
    return <DashboardStateCard variant="error">Unit not found</DashboardStateCard>;
  }

  return (
    <OperationalScreen
      title={unit.name}
      description={`${unit.type} · ${unit.ministry.name}`}
      actions={
        <Link href="/dashboard/units" className="text-sm text-primary hover:underline">
          ← All units
        </Link>
      }
    >
      <nav className="mb-6 flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "overview" && summaryQuery.data && (
        <dl className="grid gap-4 sm:grid-cols-3">
          <DashboardStateCard>
            <dt className="text-sm text-muted-foreground">Members</dt>
            <dd className="text-2xl font-semibold">
              {String(summaryQuery.data.memberCount ?? 0)}
            </dd>
          </DashboardStateCard>
          <DashboardStateCard>
            <dt className="text-sm text-muted-foreground">Leaders</dt>
            <dd className="text-2xl font-semibold">
              {String(summaryQuery.data.activeLeaders ?? 0)}
            </dd>
          </DashboardStateCard>
          <DashboardStateCard>
            <dt className="text-sm text-muted-foreground">Type</dt>
            <dd className="text-lg font-semibold">{String(summaryQuery.data.type)}</dd>
          </DashboardStateCard>
        </dl>
      )}

      {tab === "members" && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {((membersQuery.data ?? []) as Array<Record<string, unknown>>).map((row) => {
            const member = row.member as Record<string, string> | undefined;
            return (
              <li key={String(row.id)} className="px-4 py-3">
                <p className="font-medium">
                  {member?.firstName} {member?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{String(row.status)}</p>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "leadership" && leadershipQuery.data && (
        <div className="space-y-4">
          <h3 className="font-semibold">Current leaders</h3>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {(
              (leadershipQuery.data.current as Array<Record<string, unknown>>) ?? []
            ).map((a) => {
              const member = a.member as Record<string, string>;
              const position = a.position as Record<string, string>;
              return (
                <li key={String(a.id)} className="px-4 py-3 text-sm">
                  {member?.firstName} {member?.lastName} — {position?.name}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === "permissions" && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {((permissionsQuery.data ?? []) as Array<Record<string, unknown>>).map((row) => (
            <li key={String(row.id)} className="px-4 py-3 text-sm">
              {String(row.permission)}
            </li>
          ))}
        </ul>
      )}

      {tab === "settings" && settings && (
        <div className="max-w-lg space-y-4">
          {(
            [
              ["allowEvents", "Events"],
              ["allowAttendance", "Attendance"],
              ["allowReports", "Reports"],
              ["allowAnnouncements", "Announcements"],
              ["allowDocuments", "Documents"],
              ["allowAssets", "Assets"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                disabled={!canManage || settingsMutation.isPending}
                onChange={(e) =>
                  settingsMutation.mutate({ [key]: e.target.checked })
                }
              />
            </label>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {((activityQuery.data ?? []) as Array<Record<string, unknown>>).map((row) => (
            <li key={String(row.id)} className="px-4 py-3 text-sm">
              <span className="font-medium">{String(row.action)}</span>
            </li>
          ))}
        </ul>
      )}
    </OperationalScreen>
  );
}
