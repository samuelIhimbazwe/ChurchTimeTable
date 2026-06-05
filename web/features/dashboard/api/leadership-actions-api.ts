import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export type ChoirJoinRequestRow = {
  id: string;
  status: string;
  createdAt: string;
  member: { id: string; firstName: string; lastName: string };
  choir: { id: string; name: string; code: string };
};

export type ProtocolClaimRow = {
  id: string;
  status: string;
  message?: string | null;
  createdAt: string;
  member?: { firstName: string; lastName: string };
};

export type ChoirSchedulingDashboard = {
  upcomingServices: number;
  upcomingRehearsals: number;
  upcomingPrayer: number;
  missingMembers?: unknown[];
};

export type ProtocolTeamLeaderDashboard = {
  teams: Array<{
    id: string;
    occurrence?: { title: string; startAt: string };
    status?: string;
  }>;
  pendingReplacements: unknown[];
  reports: unknown[];
};

export async function fetchChoirJoinRequestsForReview(status = "PENDING") {
  const res = await http.get<ApiEnvelope<ChoirJoinRequestRow[]>>(
    "/choirs/join-requests",
    { params: { status } },
  );
  return res.data.data ?? [];
}

export async function fetchProtocolClaimsForReview() {
  const res = await http.get<ApiEnvelope<ProtocolClaimRow[]>>("/protocol/claims");
  const rows = res.data.data ?? [];
  return rows.filter((row) => row.status === "PENDING");
}

export async function fetchChoirSchedulingDashboard() {
  const res = await http.get<ApiEnvelope<ChoirSchedulingDashboard>>(
    "/choir/scheduling/dashboard",
  );
  return res.data.data;
}

export async function fetchProtocolTeamLeaderDashboard() {
  const res = await http.get<ApiEnvelope<ProtocolTeamLeaderDashboard>>(
    "/protocol/dashboard/team-leader",
  );
  return res.data.data;
}
