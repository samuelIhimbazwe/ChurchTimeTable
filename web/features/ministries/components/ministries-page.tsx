"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistries } from "@/features/ministries/api/ministries-api";
import { getApiErrorMessage } from "@/core/api/http";
import { hasPermission } from "@/core/auth/rbac";
import { useSessionStore } from "@/core/auth/session-store";

export function MinistriesPage() {
  const profile = useSessionStore((s) => s.profile);
  const canManage = hasPermission(profile, [
    "ministry.manage",
    "ministry.create",
  ]);

  const listQuery = useQuery({
    queryKey: ["ministries"],
    queryFn: fetchMinistries,
  });

  return (
    <OperationalScreen
      title="Ministries"
      description="Church ministries — membership, leadership, and permissions (MF-1)."
    >
      {listQuery.isLoading && <DashboardStateCard>Loading ministries…</DashboardStateCard>}
      {listQuery.isError && (
        <DashboardStateCard variant="error">
          {getApiErrorMessage(listQuery.error, "Failed to load ministries")}
        </DashboardStateCard>
      )}

      {listQuery.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listQuery.data.map((ministry) => (
            <Link
              key={ministry.id}
              href={`/dashboard/ministries/${ministry.id}`}
              className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {ministry.code}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{ministry.name}</h2>
              {ministry.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {ministry.description}
                </p>
              )}
              <dl className="mt-4 flex gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="font-medium">{ministry.memberCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Leaders</dt>
                  <dd className="font-medium">{ministry.leadershipCount}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}

      {canManage && (
        <p className="mt-6 text-sm text-muted-foreground">
          Ministry creation and advanced management are available to administrators with
          ministry.create / ministry.manage permissions.
        </p>
      )}
    </OperationalScreen>
  );
}
