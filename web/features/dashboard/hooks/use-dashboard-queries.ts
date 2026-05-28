"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAdminDashboard,
  fetchLeaderDashboard,
  fetchMemberDashboard,
} from "@/core/api/http";

export function useLeaderDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "leader"],
    queryFn: fetchLeaderDashboard,
    enabled,
  });
}

export function useMemberDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "member"],
    queryFn: fetchMemberDashboard,
    enabled,
  });
}

export function useAdminDashboardQuery(enabled = true) {
  return useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: fetchAdminDashboard,
    enabled,
  });
}
