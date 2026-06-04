"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  addMinistryMember,
  endMinistryLeadership,
  fetchMinistry,
  fetchMinistryActivity,
  fetchMinistryLeadership,
  fetchMinistryMembers,
  fetchMinistryPermissions,
  fetchMinistrySettings,
  fetchMinistrySummary,
  grantMinistryPermission,
  removeMinistryMember,
  revokeMinistryPermission,
  updateMinistrySettings,
} from "@/features/ministries/api/ministries-api";
import type { MinistryTab } from "@/features/ministries/types";
import { fetchMinistryDashboard } from "@/features/ministry-services/api/ministry-services-api";
import { getApiErrorMessage } from "@/core/api/http";
import { hasPermission } from "@/core/auth/rbac";
import { useSessionStore } from "@/core/auth/session-store";

const TABS: MinistryTab[] = [
  "overview",
  "members",
  "units",
  "leadership",
  "announcements",
  "documents",
  "meetings",
  "reports",
  "activity",
  "permissions",
  "settings",
];

const SCOPED_PERMISSIONS = [
  "ministry.member.view",
  "ministry.member.manage",
  "ministry.leadership.manage",
  "ministry.reports.view",
  "ministry.settings.manage",
];

export function MinistryDetailPage({ ministryId }: { ministryId: string }) {
  const profile = useSessionStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<MinistryTab>("overview");
  const [memberSearch, setMemberSearch] = useState("");
  const [newMemberId, setNewMemberId] = useState("");
  const [grantMemberId, setGrantMemberId] = useState("");
  const [grantPermission, setGrantPermission] = useState(SCOPED_PERMISSIONS[0]);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission(profile, ["ministry.manage", "ministry.member.manage"]);
  const canGrant = hasPermission(profile, ["ministry.manage"]);

  const ministryQuery = useQuery({
    queryKey: ["ministries", ministryId],
    queryFn: () => fetchMinistry(ministryId),
  });

  const summaryQuery = useQuery({
    queryKey: ["ministries", ministryId, "summary"],
    queryFn: () => fetchMinistrySummary(ministryId),
    enabled: tab === "overview",
  });

  const membersQuery = useQuery({
    queryKey: ["ministries", ministryId, "members", memberSearch],
    queryFn: () => fetchMinistryMembers(ministryId, memberSearch || undefined),
    enabled: tab === "members",
  });

  const leadershipQuery = useQuery({
    queryKey: ["ministries", ministryId, "leadership"],
    queryFn: () => fetchMinistryLeadership(ministryId),
    enabled: tab === "leadership",
  });

  const permissionsQuery = useQuery({
    queryKey: ["ministries", ministryId, "permissions"],
    queryFn: () => fetchMinistryPermissions(ministryId),
    enabled: tab === "permissions",
  });

  const settingsQuery = useQuery({
    queryKey: ["ministries", ministryId, "settings"],
    queryFn: () => fetchMinistrySettings(ministryId),
    enabled: tab === "settings",
  });

  const activityQuery = useQuery({
    queryKey: ["ministries", ministryId, "activity"],
    queryFn: () => fetchMinistryActivity(ministryId),
    enabled: tab === "activity",
  });

  const dashboardQuery = useQuery({
    queryKey: ["ministries", ministryId, "dashboard"],
    queryFn: () => fetchMinistryDashboard(ministryId),
    enabled: tab === "overview",
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["ministries"] });
    await queryClient.invalidateQueries({ queryKey: ["ministries", ministryId] });
  };

  const addMemberMutation = useMutation({
    mutationFn: () => addMinistryMember(ministryId, newMemberId.trim()),
    onSuccess: async () => {
      setNewMemberId("");
      await invalidate();
      await membersQuery.refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to add member")),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMinistryMember(ministryId, memberId),
    onSuccess: async () => {
      await invalidate();
      await membersQuery.refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to remove member")),
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      grantMinistryPermission(ministryId, {
        memberId: grantMemberId.trim(),
        permission: grantPermission,
      }),
    onSuccess: async () => {
      setGrantMemberId("");
      await permissionsQuery.refetch();
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to grant permission")),
  });

  const revokeMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      revokeMinistryPermission(ministryId, assignmentId),
    onSuccess: () => permissionsQuery.refetch(),
    onError: (err) => setError(getApiErrorMessage(err, "Failed to revoke permission")),
  });

  const endLeadershipMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      endMinistryLeadership(ministryId, assignmentId),
    onSuccess: () => leadershipQuery.refetch(),
    onError: (err) => setError(getApiErrorMessage(err, "Failed to end assignment")),
  });

  const settingsMutation = useMutation({
    mutationFn: (input: Record<string, boolean>) =>
      updateMinistrySettings(ministryId, input),
    onSuccess: () => settingsQuery.refetch(),
    onError: (err) => setError(getApiErrorMessage(err, "Failed to save settings")),
  });

  const ministry = ministryQuery.data;
  const settings = settingsQuery.data;

  const settingsToggles = useMemo(
    () =>
      settings
        ? [
            { key: "allowDevotions" as const, label: "Devotions" },
            { key: "allowAnnouncements" as const, label: "Announcements" },
            { key: "allowDocuments" as const, label: "Documents" },
            { key: "allowMeetings" as const, label: "Meetings" },
            { key: "allowAssets" as const, label: "Assets" },
            { key: "allowOperationalUnits" as const, label: "Operational units (MF-2)" },
            { key: "allowReporting" as const, label: "Reporting" },
          ]
        : [],
    [settings],
  );

  if (ministryQuery.isLoading) {
    return <DashboardStateCard>Loading ministry…</DashboardStateCard>;
  }

  if (!ministry) {
    return <DashboardStateCard variant="error">Ministry not found</DashboardStateCard>;
  }

  return (
    <OperationalScreen
      title={ministry.name}
      description={ministry.description ?? ministry.code}
      actions={
        <Link href="/dashboard/ministries" className="text-sm text-primary hover:underline">
          ← All ministries
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

      {error && (
        <DashboardStateCard variant="error" className="mb-4">
          {error}
        </DashboardStateCard>
      )}

      {tab === "overview" && (summaryQuery.data || dashboardQuery.data) && (
        <div className="space-y-6">
          <dl className="grid gap-4 sm:grid-cols-3">
            <DashboardStateCard>
              <dt className="text-sm text-muted-foreground">Members</dt>
              <dd className="text-2xl font-semibold">
                {dashboardQuery.data?.members ?? summaryQuery.data?.memberCount ?? 0}
              </dd>
            </DashboardStateCard>
            <DashboardStateCard>
              <dt className="text-sm text-muted-foreground">Operational units</dt>
              <dd className="text-2xl font-semibold">
                {dashboardQuery.data?.operationalUnits ?? 0}
              </dd>
            </DashboardStateCard>
            <DashboardStateCard>
              <dt className="text-sm text-muted-foreground">Active leaders</dt>
              <dd className="text-2xl font-semibold">
                {dashboardQuery.data?.leaders ?? summaryQuery.data?.activeLeaders ?? 0}
              </dd>
            </DashboardStateCard>
          </dl>
          {dashboardQuery.data && (
            <dl className="grid gap-4 sm:grid-cols-4">
              <DashboardStateCard>
                <dt className="text-sm text-muted-foreground">Announcements</dt>
                <dd className="text-xl font-semibold">{dashboardQuery.data.announcements}</dd>
              </DashboardStateCard>
              <DashboardStateCard>
                <dt className="text-sm text-muted-foreground">Documents</dt>
                <dd className="text-xl font-semibold">{dashboardQuery.data.documents}</dd>
              </DashboardStateCard>
              <DashboardStateCard>
                <dt className="text-sm text-muted-foreground">Meetings</dt>
                <dd className="text-xl font-semibold">{dashboardQuery.data.meetings}</dd>
              </DashboardStateCard>
              <DashboardStateCard>
                <dt className="text-sm text-muted-foreground">New members (30d)</dt>
                <dd className="text-xl font-semibold">
                  {dashboardQuery.data.growthMetrics.newMembersLast30Days}
                </dd>
              </DashboardStateCard>
            </dl>
          )}
          <div className="flex flex-wrap gap-2">
            {(["announcements", "documents", "meetings", "reports", "activity"] as const).map(
              (section) => (
                <Link
                  key={section}
                  href={`/dashboard/ministries/${ministryId}/${section}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {section}
                </Link>
              ),
            )}
            <Link
              href={`/dashboard/ministries/${ministryId}/finance`}
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Finance
            </Link>
            <Link
              href="/dashboard/units"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Operational units
            </Link>
          </div>
        </div>
      )}

      {tab === "units" && (
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/units" className="text-primary underline">
            Open operational units
          </Link>{" "}
          filtered by ministry in the directory.
        </p>
      )}

      {["announcements", "documents", "meetings", "reports"].includes(tab) && (
        <p className="text-sm">
          <Link
            href={`/dashboard/ministries/${ministryId}/${tab}`}
            className="text-primary underline"
          >
            Open full {tab} workspace →
          </Link>
        </p>
      )}

      {tab === "members" && (
        <div className="space-y-4">
          <input
            type="search"
            placeholder="Search members…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="w-full max-w-md rounded border border-border px-3 py-2 text-sm"
          />
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Member UUID"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                className="min-w-[240px] flex-1 rounded border border-border px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={!newMemberId.trim() || addMemberMutation.isPending}
                onClick={() => addMemberMutation.mutate()}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Add member
              </button>
            </div>
          )}
          <ul className="divide-y divide-border rounded-lg border border-border">
            {(membersQuery.data ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">
                    {row.member.firstName} {row.member.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.status} · joined {new Date(row.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                {canManage && row.status !== "REMOVED" && (
                  <button
                    type="button"
                    className="text-sm text-destructive"
                    onClick={() => removeMemberMutation.mutate(row.memberId)}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "leadership" && leadershipQuery.data && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 font-semibold">Current leaders</h3>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {leadershipQuery.data.current.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">
                      {a.member.firstName} {a.member.lastName} — {a.position.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Since {new Date(a.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground"
                      onClick={() => endLeadershipMutation.mutate(a.id)}
                    >
                      End assignment
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">History</h3>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {leadershipQuery.data.history.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  {a.member.firstName} {a.member.lastName} — {a.position.name}
                  {a.endedAt && (
                    <span className="text-muted-foreground">
                      {" "}
                      (ended {new Date(a.endedAt).toLocaleDateString()})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === "permissions" && (
        <div className="space-y-4">
          {canGrant && (
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Member UUID"
                value={grantMemberId}
                onChange={(e) => setGrantMemberId(e.target.value)}
                className="min-w-[200px] rounded border border-border px-3 py-2 text-sm"
              />
              <select
                value={grantPermission}
                onChange={(e) => setGrantPermission(e.target.value)}
                className="rounded border border-border px-3 py-2 text-sm"
              >
                {SCOPED_PERMISSIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!grantMemberId.trim() || grantMutation.isPending}
                onClick={() => grantMutation.mutate()}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                Grant
              </button>
            </div>
          )}
          <ul className="divide-y divide-border rounded-lg border border-border">
            {(permissionsQuery.data ?? []).map((row) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{row.permission}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.member.firstName} {row.member.lastName}
                  </p>
                </div>
                {canGrant && (
                  <button
                    type="button"
                    className="text-sm text-destructive"
                    onClick={() => revokeMutation.mutate(row.id)}
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "settings" && settings && (
        <div className="space-y-4 max-w-lg">
          {settingsToggles.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm">{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
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
        <div className="space-y-3">
          <Link
            href={`/dashboard/ministries/${ministryId}/activity`}
            className="text-sm text-primary underline"
          >
            Open full activity feed →
          </Link>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {(activityQuery.data ?? []).map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{row.type}</span>
                {row.summary && (
                  <span className="text-muted-foreground"> — {row.summary}</span>
                )}
                <span className="block text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()}
                  {row.actor?.email && ` · ${row.actor.email}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </OperationalScreen>
  );
}
