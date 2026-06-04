"use client";

import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/http";

export function useMemberPortalDashboard(enabled = true) {
  return useQuery({
    queryKey: ["member-portal", "dashboard"],
    queryFn: async () => {
      const res = await http.get("/member-portal/dashboard");
      return res.data.data as Record<string, unknown>;
    },
    enabled,
  });
}

export function useDashboardContext(enabled = true) {
  return useQuery({
    queryKey: ["member-portal", "dashboard-context"],
    queryFn: async () => {
      const res = await http.get("/member-portal/dashboard-context");
      return res.data.data as {
        dashboards: Array<{ key: string; label: string; path: string }>;
        defaultDashboard: string;
      };
    },
    enabled,
  });
}

export function usePublicChoirs(enabled = true) {
  return useQuery({
    queryKey: ["choirs", "public"],
    queryFn: async () => {
      const res = await http.get("/choirs/public");
      return res.data.data as unknown[];
    },
    enabled,
  });
}

export function useMembershipCenter(enabled = true) {
  return useQuery({
    queryKey: ["member-portal", "membership"],
    queryFn: async () => {
      const res = await http.get("/member-portal/membership");
      return res.data.data as Record<string, unknown>;
    },
    enabled,
  });
}

export function useChurchBroadcasts(enabled = true) {
  return useQuery({
    queryKey: ["church", "broadcasts"],
    queryFn: async () => {
      const res = await http.get("/church/broadcasts");
      return res.data.data as unknown[];
    },
    enabled,
  });
}
