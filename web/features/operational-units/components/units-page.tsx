"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { OperationalScreen } from "@/components/ui/operational-screen";
import { DashboardStateCard } from "@/features/dashboard/components/dashboard-primitives";
import { fetchOperationalUnits } from "@/features/operational-units/api/operational-units-api";
import { getApiErrorMessage } from "@/core/api/http";

export function UnitsPage() {
  const listQuery = useQuery({
    queryKey: ["operational-units"],
    queryFn: () => fetchOperationalUnits(),
  });

  return (
    <OperationalScreen
      title="Operational units"
      description="Working groups inside ministries (MF-2)."
    >
      {listQuery.isLoading && <DashboardStateCard>Loading units…</DashboardStateCard>}
      {listQuery.isError && (
        <DashboardStateCard variant="error">
          {getApiErrorMessage(listQuery.error, "Failed to load units")}
        </DashboardStateCard>
      )}
      {listQuery.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listQuery.data.map((unit) => (
            <Link
              key={unit.id}
              href={`/dashboard/units/${unit.id}`}
              className="block rounded-lg border border-border bg-card p-4 shadow-sm transition hover:border-primary/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {unit.type} · {unit.ministry.name}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{unit.name}</h2>
              <p className="text-xs text-muted-foreground">{unit.code}</p>
              <dl className="mt-4 flex gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Members</dt>
                  <dd className="font-medium">{unit.memberCount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Leaders</dt>
                  <dd className="font-medium">{unit.leadershipCount}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </OperationalScreen>
  );
}
