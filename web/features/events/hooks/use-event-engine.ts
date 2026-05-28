"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  autoAssignChoirRotation,
  bulkAssign,
  cancelEvent,
  createAssignment,
  createEvent,
  fetchChoirRotationPool,
  fetchEventAssignments,
  fetchEvents,
  updateEvent,
  validateAssignment,
} from "@/core/api/http";
import type { AssignmentFormInput, EventFormInput } from "@/core/api/types";

export function useEventsQuery(filters: {
  from?: string;
  to?: string;
  ministryScope?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: () => fetchEvents({ page: 1, limit: 400, ...filters }),
  });
}

export function useEventAssignmentsQuery(eventId: string | null) {
  return useQuery({
    queryKey: ["event-assignments", eventId],
    queryFn: () => fetchEventAssignments(eventId ?? "", 1, 100),
    enabled: Boolean(eventId),
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventFormInput) => createEvent(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, input }: { eventId: string; input: Partial<EventFormInput> }) =>
      updateEvent(eventId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useCancelEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => cancelEvent(eventId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useValidateAssignmentMutation() {
  return useMutation({
    mutationFn: (input: AssignmentFormInput) => validateAssignment(input),
  });
}

export function useCreateAssignmentMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignmentFormInput) => createAssignment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event-assignments", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useBulkAssignMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignments: AssignmentFormInput[]) => bulkAssign(assignments),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event-assignments", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useChoirRotationPoolQuery(eventId: string | null) {
  return useQuery({
    queryKey: ["choir-rotation-pool", eventId],
    queryFn: () => fetchChoirRotationPool(eventId ?? ""),
    enabled: Boolean(eventId),
  });
}

export function useAutoAssignChoirRotationMutation(eventId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => autoAssignChoirRotation(eventId ?? "", count),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["event-assignments", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["choir-rotation-pool", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
