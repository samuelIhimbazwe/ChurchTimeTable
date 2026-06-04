"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchAsset, fetchAssetActivity } from "@/features/assets/api/assets-api";

const TABS = [
  "overview",
  "ownership",
  "custodian",
  "assignments",
  "maintenance",
  "activity",
] as const;

export function AssetDetailPage({ assetId }: { assetId: string }) {
  const assetQuery = useQuery({
    queryKey: ["assets", assetId],
    queryFn: () => fetchAsset(assetId),
  });

  const activityQuery = useQuery({
    queryKey: ["assets", assetId, "activity"],
    queryFn: () => fetchAssetActivity(assetId),
  });

  const asset = assetQuery.data;

  return (
    <OperationalScreen
      title={asset ? `${asset.code} — ${asset.name}` : "Asset"}
      description="Ownership, custody, assignments, and maintenance"
    >
      <Link href="/dashboard/assets" className="mb-4 inline-block text-sm text-primary underline">
        ← All assets
      </Link>

      {assetQuery.isLoading && <DashboardStateCard title="Loading…" />}
      {assetQuery.error && <DashboardStateCard title="Asset not found" variant="error" />}

      {asset && (
        <div className="space-y-6">
          <nav className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            {TABS.map((t) => (
              <span key={t} className="rounded border px-2 py-1">
                {t}
              </span>
            ))}
          </nav>

          <section>
            <h2 className="mb-2 font-semibold">Overview</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd>{asset.category.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{asset.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Condition</dt>
                <dd>{asset.condition}</dd>
              </div>
              {asset.serialNumber && (
                <div>
                  <dt className="text-muted-foreground">Serial</dt>
                  <dd>{asset.serialNumber}</dd>
                </div>
              )}
            </dl>
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Ownership</h2>
            {asset.ownerships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No owners recorded.</p>
            ) : (
              <ul className="text-sm">
                {asset.ownerships.map((o) => (
                  <li key={o.id}>
                    {o.ownerType} · {o.ownerId}
                    {o.ownershipPercentage != null
                      ? ` (${o.ownershipPercentage}%)`
                      : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Custodian</h2>
            {asset.custodians.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active custodian.</p>
            ) : (
              <p className="text-sm">
                {asset.custodians[0].member.firstName}{" "}
                {asset.custodians[0].member.lastName}
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Open assignments</h2>
            {asset.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">None</p>
            ) : (
              <ul className="text-sm">
                {asset.assignments.map((a) => (
                  <li key={a.id}>
                    {a.assignedToType} → {a.assignedToId}
                    {a.purpose ? ` (${a.purpose})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 font-semibold">Activity</h2>
            {activityQuery.isLoading && <p className="text-sm">Loading timeline…</p>}
            {activityQuery.data && activityQuery.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
            {activityQuery.data && activityQuery.data.length > 0 && (
              <ul className="text-sm">
                {(activityQuery.data as Array<{ activityType: string; createdAt: string }>).map(
                  (row, i) => (
                    <li key={i}>
                      {row.activityType} · {new Date(row.createdAt).toLocaleString()}
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </div>
      )}
    </OperationalScreen>
  );
}
