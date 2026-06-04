"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getContributionDetail } from "@/features/contributions/api/getContributionDetail";
import { getContributionTimeline } from "@/features/contributions/api/getContributionTimeline";
import { getMyContributions } from "@/features/contributions/api/getMyContributions";
import { getPersonalTotals } from "@/features/contributions/api/getPersonalTotals";
import { getSubmitOptions } from "@/features/contributions/api/getSubmitOptions";
import { submitContribution } from "@/features/contributions/api/submitContribution";
import type {
  MemberContributionsQuery,
  SubmitContributionInput,
} from "@/features/contributions/types";

export const contributionKeys = {
  all: ["contributions"] as const,
  list: (query: MemberContributionsQuery) =>
    [...contributionKeys.all, "list", query] as const,
  detail: (id: string) => [...contributionKeys.all, "detail", id] as const,
  timeline: (id: string) => [...contributionKeys.all, "timeline", id] as const,
  submitOptions: () => [...contributionKeys.all, "submit-options"] as const,
  personalTotals: () => [...contributionKeys.all, "personal-totals"] as const,
};

export function useMyContributionsQuery(
  query: MemberContributionsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: contributionKeys.list(query),
    queryFn: () => getMyContributions(query),
    enabled,
  });
}

export function useContributionDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: contributionKeys.detail(id),
    queryFn: () => getContributionDetail(id),
    enabled: enabled && Boolean(id),
  });
}

export function useContributionTimelineQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: contributionKeys.timeline(id),
    queryFn: () => getContributionTimeline(id),
    enabled: enabled && Boolean(id),
  });
}

export function useSubmitOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: contributionKeys.submitOptions(),
    queryFn: getSubmitOptions,
    enabled,
  });
}

export function usePersonalContributionTotalsQuery(enabled = true) {
  return useQuery({
    queryKey: contributionKeys.personalTotals(),
    queryFn: getPersonalTotals,
    enabled,
  });
}

export function useSubmitContributionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitContributionInput) => submitContribution(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contributionKeys.all });
    },
  });
}
