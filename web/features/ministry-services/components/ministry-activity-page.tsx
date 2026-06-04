"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistryActivityFeed } from "@/features/ministry-services/api/ministry-services-api";
import { MinistryServicesShell } from "@/features/ministry-services/components/ministry-services-shell";

export function MinistryActivityPage({ ministryId }: { ministryId: string }) {
  const query = useQuery({
    queryKey: ["ministries", ministryId, "activity-feed"],
    queryFn: () => fetchMinistryActivityFeed(ministryId),
  });

  return (
    <MinistryServicesShell ministryId={ministryId} active="activity" title="Activity">
      {query.isLoading && <DashboardStateCard variant="loading" message="Loading activity…" />}
      {query.isError && <DashboardStateCard variant="error" message="Could not load activity." />}
      {query.data && (
        <ul className="space-y-2">
          {query.data.length === 0 ? (
            <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
          ) : (
            query.data.map((row) => (
              <li key={row.id} className="rounded-lg border px-4 py-3 text-sm">
                <span className="font-medium">{row.type}</span>
                {row.summary && <span className="text-muted-foreground"> — {row.summary}</span>}
                <div className="text-xs text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString()}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </MinistryServicesShell>
  );
}
