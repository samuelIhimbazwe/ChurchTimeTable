"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistryAnnouncements } from "@/features/ministry-services/api/ministry-services-api";
import { MinistryServicesShell } from "@/features/ministry-services/components/ministry-services-shell";

export function MinistryAnnouncementsPage({ ministryId }: { ministryId: string }) {
  const query = useQuery({
    queryKey: ["ministries", ministryId, "announcements"],
    queryFn: () => fetchMinistryAnnouncements(ministryId),
  });

  return (
    <MinistryServicesShell ministryId={ministryId} active="announcements" title="Announcements">
      {query.isLoading && <DashboardStateCard variant="loading" message="Loading announcements…" />}
      {query.isError && (
        <DashboardStateCard variant="error" message="Could not load announcements." />
      )}
      {query.data && (
        <ul className="space-y-3">
          {query.data.length === 0 ? (
            <li className="text-sm text-muted-foreground">No announcements yet.</li>
          ) : (
            query.data.map((item) => (
              <li key={item.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className="text-xs text-muted-foreground">{item.priority}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.content}</p>
                {item.isPinned && (
                  <span className="mt-2 inline-block text-xs font-medium text-primary">Pinned</span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </MinistryServicesShell>
  );
}
