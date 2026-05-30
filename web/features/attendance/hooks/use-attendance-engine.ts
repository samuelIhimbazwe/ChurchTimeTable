"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveExcusedAttendance,
  bulkUpsertAttendance,
  escalateAttendance,
  fetchAttendanceAnalytics,
  fetchAttendanceByEvent,
  fetchCoordinatorAttendanceSummary,
  fetchEventAssignments,
  fetchEvents,
  fetchMemberAttendanceScore,
  fetchPresidentAttendanceSummary,
  fetchTeamHeadAttendanceSummary,
  fetchChoirAttendanceSummary,
  fetchMemberAttendanceHistory,
  fetchDisciplineRecommendations,
  upsertAttendance,
} from "@/core/api/http";
import type { AttendanceUpsertInput } from "@/core/api/types";

export function useUpcomingEventsQuery() {
  const now = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 30);
  return useQuery({
    queryKey: ["events", "upcoming-attendance"],
    queryFn: () =>
      fetchEvents({
        page: 1,
        limit: 50,
        from: now.toISOString(),
        to: to.toISOString(),
      }),
  });
}

export function useEventAttendanceQuery(eventId: string | null) {
  return useQuery({
    queryKey: ["attendance", "event", eventId],
    queryFn: () => fetchAttendanceByEvent(eventId ?? ""),
    enabled: Boolean(eventId),
  });
}

export function useEventRosterQuery(eventId: string | null) {
  return useQuery({
    queryKey: ["attendance", "roster", eventId],
    queryFn: () => fetchEventAssignments(eventId ?? "", 1, 200),
    enabled: Boolean(eventId),
  });
}

export function useAttendanceAnalyticsQuery(enabled = true) {
  return useQuery({
    queryKey: ["attendance", "analytics"],
    queryFn: fetchAttendanceAnalytics,
    enabled,
  });
}

export function useTeamHeadAttendanceQuery(enabled = true) {
  return useQuery({
    queryKey: ["attendance", "team-head"],
    queryFn: fetchTeamHeadAttendanceSummary,
    enabled,
  });
}

export function useCoordinatorAttendanceQuery(enabled = true) {
  return useQuery({
    queryKey: ["attendance", "coordinator"],
    queryFn: fetchCoordinatorAttendanceSummary,
    enabled,
  });
}

export function usePresidentAttendanceQuery(enabled = true) {
  return useQuery({
    queryKey: ["attendance", "president"],
    queryFn: fetchPresidentAttendanceSummary,
    enabled,
  });
}

export function useChoirAttendanceQuery(enabled = true) {
  return useQuery({
    queryKey: ["attendance", "choir"],
    queryFn: fetchChoirAttendanceSummary,
    enabled,
  });
}

export function useMemberAttendanceHistoryQuery(memberId: string | null) {
  return useQuery({
    queryKey: ["attendance", "history", memberId],
    queryFn: () => fetchMemberAttendanceHistory(memberId ?? ""),
    enabled: Boolean(memberId),
  });
}

export function useDisciplineRecommendationsQuery(enabled = true) {
  return useQuery({
    queryKey: ["attendance", "discipline-recommendations"],
    queryFn: fetchDisciplineRecommendations,
    enabled,
  });
}

export function useMemberAttendanceScoreQuery(memberId: string | null) {
  return useQuery({
    queryKey: ["attendance", "score", memberId],
    queryFn: () => fetchMemberAttendanceScore(memberId ?? ""),
    enabled: Boolean(memberId),
  });
}

export function useUpsertAttendanceMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttendanceUpsertInput) => upsertAttendance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "analytics"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "history"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "score"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "team-head"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "coordinator"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "president"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "choir"] });
    },
  });
}

export function useBulkAttendanceMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (records: AttendanceUpsertInput[]) => bulkUpsertAttendance(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "event", eventId] });
    },
  });
}

export function useApproveExcusedMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approveExcusedAttendance(id, approve),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "event", eventId] });
    },
  });
}

export function useEscalateAttendanceMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      level,
      notes,
    }: {
      id: string;
      level: "TEAM_HEAD" | "COORDINATOR" | "PRESIDENT";
      notes?: string;
    }) => escalateAttendance(id, level, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "coordinator"] });
      queryClient.invalidateQueries({ queryKey: ["attendance", "president"] });
    },
  });
}
