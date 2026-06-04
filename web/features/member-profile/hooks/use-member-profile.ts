"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchMemberProfileAttendance,
  fetchMemberProfileCenter,
  fetchMemberProfileContributions,
  fetchMemberProfileWelfareCases,
  fetchMemberStatusHistory,
  fetchMemberTimeline,
  updateMemberProfile,
  updateMemberStatus,
  type UpdateMemberProfileInput,
} from "@/core/api/http";

export function useMemberProfileCenterQuery(memberId: string) {
  return useQuery({
    queryKey: ["members", memberId, "profile-center"],
    queryFn: () => fetchMemberProfileCenter(memberId),
    enabled: Boolean(memberId),
  });
}

export function useMemberTimelineQuery(memberId: string, enabled = true) {
  return useQuery({
    queryKey: ["members", memberId, "timeline"],
    queryFn: () => fetchMemberTimeline(memberId),
    enabled: Boolean(memberId) && enabled,
  });
}

export function useMemberProfileAttendanceQuery(memberId: string, enabled = true) {
  return useQuery({
    queryKey: ["members", memberId, "attendance"],
    queryFn: () => fetchMemberProfileAttendance(memberId),
    enabled: Boolean(memberId) && enabled,
  });
}

export function useMemberProfileContributionsQuery(
  memberId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["members", memberId, "contributions"],
    queryFn: () => fetchMemberProfileContributions(memberId),
    enabled: Boolean(memberId) && enabled,
  });
}

export function useMemberProfileWelfareQuery(memberId: string, enabled = true) {
  return useQuery({
    queryKey: ["members", memberId, "welfare-cases"],
    queryFn: () => fetchMemberProfileWelfareCases(memberId),
    enabled: Boolean(memberId) && enabled,
  });
}

export function useMemberStatusHistoryQuery(memberId: string, enabled = true) {
  return useQuery({
    queryKey: ["members", memberId, "status-history"],
    queryFn: () => fetchMemberStatusHistory(memberId),
    enabled: Boolean(memberId) && enabled,
  });
}

export function useUpdateMemberProfileMutation(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMemberProfileInput) =>
      updateMemberProfile(memberId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members", memberId] });
    },
  });
}

export function useUpdateMemberStatusMutation(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { status: string; reason?: string }) =>
      updateMemberStatus(memberId, input.status, input.reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members", memberId] });
      await queryClient.invalidateQueries({ queryKey: ["members", "directory"] });
    },
  });
}
