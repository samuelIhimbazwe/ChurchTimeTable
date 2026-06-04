"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import {
  fetchOperationOccurrences,
  fetchOperationTemplates,
  fetchOperationsDashboard,
} from "@/features/operations/api/operations-api";

type OpsTab =
  | "overview"
  | "calendar"
  | "templates"
  | "occurrences"
  | "conflicts"
  | "recommendations"
  | "reports";

const TABS: { id: OpsTab; href: string; label: string }[] = [
  { id: "overview", href: "/dashboard/operations", label: "Overview" },
  { id: "calendar", href: "/dashboard/operations/calendar", label: "Calendar" },
  { id: "templates", href: "/dashboard/operations/templates", label: "Templates" },
  { id: "occurrences", href: "/dashboard/operations/occurrences", label: "Occurrences" },
  { id: "conflicts", href: "/dashboard/operations/conflicts", label: "Conflicts" },
  {
    id: "recommendations",
    href: "/dashboard/operations/recommendations",
    label: "Recommendations",
  },
  { id: "reports", href: "/dashboard/operations/reports", label: "Reports" },
];

export function OperationsPage({ tab }: { tab: OpsTab }) {
  const dashboardQuery = useQuery({
    queryKey: ["operations", "dashboard"],
    queryFn: fetchOperationsDashboard,
    enabled: tab === "overview",
  });
  const templatesQuery = useQuery({
    queryKey: ["operations", "templates"],
    queryFn: fetchOperationTemplates,
    enabled: tab === "templates",
  });
  const occurrencesQuery = useQuery({
    queryKey: ["operations", "occurrences"],
    queryFn: fetchOperationOccurrences,
    enabled: tab === "occurrences" || tab === "calendar" || tab === "overview",
  });

  const dash = dashboardQuery.data as {
    upcomingOperations?: number;
    pendingConfirmations?: number;
    missingAssignments?: number;
    conflicts?: number;
  } | null;

  return (
    <OperationalScreen
      title="Church operations"
      description="Service scheduling, assignments, and publication workflow (MF-7)"
    >
      <nav className="mb-6 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.href}
            className={`rounded border px-2 py-1 ${tab === t.id ? "bg-primary text-primary-foreground" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && dash && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded border p-3">Upcoming: {dash.upcomingOperations}</div>
          <div className="rounded border p-3">Pending confirmations: {dash.pendingConfirmations}</div>
          <div className="rounded border p-3">Missing slots: {dash.missingAssignments}</div>
          <div className="rounded border p-3">Conflicts: {dash.conflicts}</div>
        </div>
      )}

      {tab === "templates" &&
        (templatesQuery.data as Array<{ name: string; code: string }>)?.map((t) => (
          <div key={t.code} className="mb-2 rounded border p-3 text-sm">
            {t.name} ({t.code})
          </div>
        ))}

      {(tab === "occurrences" || tab === "calendar") &&
        (occurrencesQuery.data as Array<{ id: string; title: string; status: string; startAt: string }>)?.map(
          (o) => (
            <div key={o.id} className="mb-2 rounded border p-3 text-sm">
              <strong>{o.title}</strong> — {o.status} — {new Date(o.startAt).toLocaleString()}
            </div>
          ),
        )}

      {tab === "conflicts" && (
        <p className="text-sm text-muted-foreground">
          Open an occurrence and use GET /operations/occurrences/:id/conflicts for rule violations.
        </p>
      )}

      {tab === "recommendations" && (
        <p className="text-sm text-muted-foreground">
          Use GET /operations/occurrences/:id/recommendations?assignmentType=MAIN_CHOIR
        </p>
      )}

      {tab === "reports" && (
        <p className="text-sm text-muted-foreground">
          Reports available at GET /operations/reports (CSV/PDF export).
        </p>
      )}
    </OperationalScreen>
  );
}
