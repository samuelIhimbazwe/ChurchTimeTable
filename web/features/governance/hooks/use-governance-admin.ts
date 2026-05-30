"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  assignChoirCommitteeMember,
  assignProtocolCommitteeMember,
  fetchChoirCommittee,
  fetchMembers,
  fetchProtocolCommittee,
} from "@/core/api/http";
import {
  CHOIR_GOVERNANCE_SCOPE,
  PROTOCOL_GOVERNANCE_SCOPE,
} from "@/core/governance/scopes";

export function useProtocolCommitteeQuery(enabled = true) {
  return useQuery({
    queryKey: ["governance", "protocol", PROTOCOL_GOVERNANCE_SCOPE],
    queryFn: () => fetchProtocolCommittee(PROTOCOL_GOVERNANCE_SCOPE),
    enabled,
  });
}

export function useChoirCommitteeQuery(enabled = true) {
  return useQuery({
    queryKey: ["governance", "choir", CHOIR_GOVERNANCE_SCOPE],
    queryFn: () => fetchChoirCommittee(CHOIR_GOVERNANCE_SCOPE),
    enabled,
  });
}

export function useGovernanceMembersQuery(
  ministry: "CHOIR" | "PROTOCOL",
  enabled = true,
) {
  return useQuery({
    queryKey: ["members", "governance", ministry],
    queryFn: () => fetchMembers({ ministry, limit: 200, status: "ACTIVE" }),
    enabled,
  });
}

export function useAssignProtocolMemberMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: assignProtocolCommitteeMember,
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["governance", "protocol", PROTOCOL_GOVERNANCE_SCOPE],
      });
    },
  });
}

export function useAssignChoirMemberMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: assignChoirCommitteeMember,
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["governance", "choir", CHOIR_GOVERNANCE_SCOPE],
      });
    },
  });
}
