"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import {
  fetchAssetCategories,
  fetchAssetReportInventory,
  fetchOverdueAssignments,
} from "@/features/assets/api/assets-api";

export function AssetCategoriesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: fetchAssetCategories,
  });

  return (
    <OperationalScreen title="Asset categories" description="System and custom categories">
      <Link href="/dashboard/assets" className="mb-4 inline-block text-sm text-primary underline">
        ← Assets
      </Link>
      {isLoading && <DashboardStateCard title="Loading…" />}
      {data && (
        <ul className="divide-y rounded-lg border">
          {data.map((c) => (
            <li key={c.id} className="px-4 py-2 text-sm">
              <span className="font-medium">{c.code}</span> — {c.name}
              {c.isSystem ? " (system)" : ""}
            </li>
          ))}
        </ul>
      )}
    </OperationalScreen>
  );
}

export function AssetAssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["asset-assignments-overdue"],
    queryFn: fetchOverdueAssignments,
  });

  return (
    <OperationalScreen title="Assignments" description="Overdue asset assignments">
      <Link href="/dashboard/assets" className="mb-4 inline-block text-sm text-primary underline">
        ← Assets
      </Link>
      {isLoading && <DashboardStateCard title="Loading…" />}
      {data && data.length === 0 && (
        <DashboardStateCard title="No overdue assignments" />
      )}
      {data && data.length > 0 && (
        <pre className="overflow-auto rounded border bg-muted p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </OperationalScreen>
  );
}

export function AssetMaintenancePage() {
  return (
    <OperationalScreen
      title="Maintenance"
      description="Upcoming and overdue maintenance — use asset detail for history"
    >
      <Link href="/dashboard/assets" className="mb-4 inline-block text-sm text-primary underline">
        ← Assets
      </Link>
      <DashboardStateCard
        title="Maintenance hub"
        description="View per-asset maintenance via API routes /assets/:id/maintenance"
      />
    </OperationalScreen>
  );
}

export function AssetReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["asset-report-inventory"],
    queryFn: fetchAssetReportInventory,
  });

  return (
    <OperationalScreen title="Asset reports" description="Inventory, ownership, valuation">
      <Link href="/dashboard/assets" className="mb-4 inline-block text-sm text-primary underline">
        ← Assets
      </Link>
      {isLoading && <DashboardStateCard title="Loading report…" />}
      {data != null ? (
        <pre className="overflow-auto rounded border bg-muted p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : null}
    </OperationalScreen>
  );
}
