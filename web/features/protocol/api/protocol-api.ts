import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export async function fetchProtocolDashboard() {
  const res = await http.get<ApiEnvelope<unknown>>("/protocol/dashboard");
  return res.data.data;
}

export async function fetchProtocolTeamLeaderDashboard() {
  const res = await http.get<ApiEnvelope<unknown>>("/protocol/dashboard/team-leader");
  return res.data.data;
}

export async function fetchProtocolMemberDashboard() {
  const res = await http.get<ApiEnvelope<unknown>>("/protocol/dashboard/me");
  return res.data.data;
}

export async function fetchProtocolTeams(from?: string, to?: string) {
  const res = await http.get<ApiEnvelope<unknown[]>>("/protocol/teams", {
    params: { from, to },
  });
  return res.data.data;
}

export async function fetchProtocolMembers() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/protocol/members");
  return res.data.data;
}

export async function fetchProtocolReplacements() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/protocol/replacements");
  return res.data.data;
}

export async function fetchProtocolRankings(year: number, month: number) {
  const res = await http.get<ApiEnvelope<unknown[]>>("/protocol/rankings/monthly", {
    params: { year, month },
  });
  return res.data.data;
}

export async function fetchProtocolTeamLeaders() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/protocol/team-leaders");
  return res.data.data;
}

export async function fetchMyProtocolRanking(year: number, month: number) {
  const res = await http.get<ApiEnvelope<unknown>>("/protocol/my-ranking", {
    params: { year, month },
  });
  return res.data.data;
}

export async function fetchMyProtocolStatistics() {
  const res = await http.get<ApiEnvelope<unknown>>("/protocol/my-statistics");
  return res.data.data;
}

export async function fetchProtocolCategoryRankings(
  year: number,
  month: number,
  category: string,
) {
  const res = await http.get<ApiEnvelope<unknown[]>>("/protocol/rankings/categories", {
    params: { year, month, category },
  });
  return res.data.data;
}

export async function fetchProtocolSettings() {
  const res = await http.get<ApiEnvelope<unknown>>("/protocol/settings");
  return res.data.data;
}
