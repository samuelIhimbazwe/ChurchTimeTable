"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { approveContribution } from "@/features/family-contributions/api/approveContribution";
import { getFamilyContext } from "@/features/family-contributions/api/getFamilyContext";
import { getFamilyInbox } from "@/features/family-contributions/api/getFamilyInbox";
import { getFamilyRankings } from "@/features/family-contributions/api/getFamilyRankings";
import { getFamilyTotals } from "@/features/family-contributions/api/getFamilyTotals";
import { rejectContribution } from "@/features/family-contributions/api/rejectContribution";
import { getContributionDetail } from "@/features/contributions/api/getContributionDetail";
import { getContributionTimeline } from "@/features/contributions/api/getContributionTimeline";
import type { ContributionStatus } from "@/features/contributions/types";
import type {
  ApproveContributionInput,
  RejectContributionInput,
} from "@/features/family-contributions/types";

export const familyContributionKeys = {
  all: ["family-contributions"] as const,
  context: () => [...familyContributionKeys.all, "context"] as const,
  inbox: (familyId: string, status?: ContributionStatus) =>
    [...familyContributionKeys.all, "inbox", familyId, status] as const,
  totals: (familyId: string) =>
    [...familyContributionKeys.all, "totals", familyId] as const,
  rankings: (familyId: string) =>
    [...familyContributionKeys.all, "rankings", familyId] as const,
  detail: (id: string) => [...familyContributionKeys.all, "detail", id] as const,
  timeline: (id: string) => [...familyContributionKeys.all, "timeline", id] as const,
};

export function useFamilyContextQuery(enabled = true) {
  return useQuery({
    queryKey: familyContributionKeys.context(),
    queryFn: getFamilyContext,
    enabled,
    retry: false,
  });
}

export function useFamilyInboxQuery(
  familyId: string | undefined,
  status?: ContributionStatus,
  enabled = true,
) {
  return useQuery({
    queryKey: familyContributionKeys.inbox(familyId ?? "", status),
    queryFn: () => getFamilyInbox(familyId!, { status, limit: 50 }),
    enabled: enabled && Boolean(familyId),
  });
}

export function useFamilyTotalsQuery(familyId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: familyContributionKeys.totals(familyId ?? ""),
    queryFn: () => getFamilyTotals(familyId!),
    enabled: enabled && Boolean(familyId),
  });
}

export function useFamilyRankingsQuery(
  familyId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: familyContributionKeys.rankings(familyId ?? ""),
    queryFn: () => getFamilyRankings(familyId!, 15),
    enabled: enabled && Boolean(familyId),
  });
}

export function useFamilyContributionDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: familyContributionKeys.detail(id),
    queryFn: () => getContributionDetail(id),
    enabled: enabled && Boolean(id),
  });
}

export function useFamilyContributionTimelineQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: familyContributionKeys.timeline(id),
    queryFn: () => getContributionTimeline(id),
    enabled: enabled && Boolean(id),
  });
}

export function useApproveFamilyContributionMutation(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contributionId,
      input,
    }: {
      contributionId: string;
      input: ApproveContributionInput;
    }) => approveContribution(contributionId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: familyContributionKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
  });
}

export function useRejectFamilyContributionMutation(familyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contributionId,
      input,
    }: {
      contributionId: string;
      input: RejectContributionInput;
    }) => rejectContribution(contributionId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: familyContributionKeys.all });
      await queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
  });
}
