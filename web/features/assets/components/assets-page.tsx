"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchAssets } from "@/features/assets/api/assets-api";

export function AssetsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["assets"],
    queryFn: () => fetchAssets(),
  });

  return (
    <OperationalScreen
      title="Assets"
      description="Church-owned and ministry-owned resource inventory"
    >
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/dashboard/assets/categories" className="text-primary underline">
          Categories
        </Link>
        <Link href="/dashboard/assets/assignments" className="text-primary underline">
          Assignments
        </Link>
        <Link href="/dashboard/assets/maintenance" className="text-primary underline">
          Maintenance
        </Link>
        <Link href="/dashboard/assets/reports" className="text-primary underline">
          Reports
        </Link>
      </div>

      {isLoading && <DashboardStateCard title="Loading assets…" />}
      {error && (
        <DashboardStateCard title="Could not load assets" variant="error" />
      )}
      {data && data.length === 0 && (
        <DashboardStateCard title="No assets yet" description="Create assets from the API or admin tools." />
      )}
      {data && data.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card">
          {data.map((asset) => (
            <li key={asset.id} className="px-4 py-3">
              <Link
                href={`/dashboard/assets/${asset.id}`}
                className="font-medium text-primary hover:underline"
              >
                {asset.code} — {asset.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {asset.category.name} · {asset.status} · {asset.condition}
              </p>
            </li>
          ))}
        </ul>
      )}
    </OperationalScreen>
  );
}
