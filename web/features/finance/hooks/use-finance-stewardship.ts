"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveFinanceTransaction,
  fetchFinanceStewardshipAnalytics,
  fetchMyContributions,
} from "@/core/api/http";

export function useFinanceStewardshipQuery(
  ministryScope?: "CHOIR" | "PROTOCOL",
  enabled = true,
) {
  return useQuery({
    queryKey: ["finance", "stewardship", ministryScope ?? "all"],
    queryFn: () => fetchFinanceStewardshipAnalytics(ministryScope),
    enabled,
  });
}

export function useMyContributionsQuery(enabled = true) {
  return useQuery({
    queryKey: ["finance", "contributions", "mine"],
    queryFn: fetchMyContributions,
    enabled,
  });
}

export function useApproveFinanceTransactionMutation(ministryScope?: "CHOIR" | "PROTOCOL") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approveFinanceTransaction(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["finance", "stewardship", ministryScope ?? "all"],
      });
    },
  });
}
