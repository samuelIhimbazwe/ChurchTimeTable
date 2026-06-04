"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistryDocuments } from "@/features/ministry-services/api/ministry-services-api";
import { MinistryServicesShell } from "@/features/ministry-services/components/ministry-services-shell";

export function MinistryDocumentsPage({ ministryId }: { ministryId: string }) {
  const query = useQuery({
    queryKey: ["ministries", ministryId, "documents"],
    queryFn: () => fetchMinistryDocuments(ministryId),
  });

  return (
    <MinistryServicesShell ministryId={ministryId} active="documents" title="Documents">
      {query.isLoading && <DashboardStateCard variant="loading" message="Loading documents…" />}
      {query.isError && <DashboardStateCard variant="error" message="Could not load documents." />}
      {query.data && (
        <ul className="space-y-3">
          {query.data.length === 0 ? (
            <li className="text-sm text-muted-foreground">No documents yet.</li>
          ) : (
            query.data.map((doc) => (
              <li key={doc.id} className="rounded-lg border p-4">
                <h3 className="font-medium">{doc.title}</h3>
                <p className="text-xs text-muted-foreground">{doc.category}</p>
                {doc.currentVersion?.fileUrl && (
                  <a
                    href={doc.currentVersion.fileUrl}
                    className="mt-2 inline-block text-sm text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download latest version
                  </a>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </MinistryServicesShell>
  );
}
