"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistryMeetings } from "@/features/ministry-services/api/ministry-services-api";
import { MinistryServicesShell } from "@/features/ministry-services/components/ministry-services-shell";

export function MinistryMeetingsPage({ ministryId }: { ministryId: string }) {
  const query = useQuery({
    queryKey: ["ministries", ministryId, "meetings"],
    queryFn: () => fetchMinistryMeetings(ministryId),
  });

  return (
    <MinistryServicesShell ministryId={ministryId} active="meetings" title="Meetings">
      {query.isLoading && <DashboardStateCard variant="loading" message="Loading meetings…" />}
      {query.isError && <DashboardStateCard variant="error" message="Could not load meetings." />}
      {query.data && (
        <ul className="space-y-3">
          {query.data.length === 0 ? (
            <li className="text-sm text-muted-foreground">No meetings scheduled.</li>
          ) : (
            query.data.map((meeting) => (
              <li key={meeting.id} className="rounded-lg border p-4">
                <h3 className="font-medium">{meeting.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(meeting.scheduledAt).toLocaleString()} · {meeting.status}
                </p>
                {meeting.location && (
                  <p className="text-sm text-muted-foreground">{meeting.location}</p>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </MinistryServicesShell>
  );
}
