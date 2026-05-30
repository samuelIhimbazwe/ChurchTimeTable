"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOperationalDashboard } from "@/core/api/http";
import type { OperationalDashboardRole } from "@/core/auth/governance-permissions";

export function useOperationalDashboardQuery(
  role: OperationalDashboardRole | null,
) {
  return useQuery({
    queryKey: ["dashboard", "operational", role],
    queryFn: () => fetchOperationalDashboard(role!),
    enabled: Boolean(role),
  });
}
