"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchMinistry } from "@/features/ministries/api/ministries-api";

const SUB_LINKS = [
  { slug: "announcements", label: "Announcements" },
  { slug: "documents", label: "Documents" },
  { slug: "meetings", label: "Meetings" },
  { slug: "reports", label: "Reports" },
  { slug: "activity", label: "Activity" },
] as const;

export function MinistryServicesShell({
  ministryId,
  active,
  title,
  children,
}: {
  ministryId: string;
  active: (typeof SUB_LINKS)[number]["slug"];
  title: string;
  children: React.ReactNode;
}) {
  const ministryQuery = useQuery({
    queryKey: ["ministries", ministryId],
    queryFn: () => fetchMinistry(ministryId),
  });

  const ministry = ministryQuery.data;

  return (
    <OperationalScreen
      title={title}
      description={ministry ? `${ministry.name} · ${ministry.code}` : "Ministry services"}
      backHref={`/dashboard/ministries/${ministryId}`}
    >
      <nav className="mb-6 flex flex-wrap gap-2">
        {SUB_LINKS.map((link) => (
          <Link
            key={link.slug}
            href={`/dashboard/ministries/${ministryId}/${link.slug}`}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              active === link.slug
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:bg-muted"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {ministryQuery.isLoading ? (
        <DashboardStateCard variant="loading" message="Loading ministry…" />
      ) : (
        children
      )}
    </OperationalScreen>
  );
}
