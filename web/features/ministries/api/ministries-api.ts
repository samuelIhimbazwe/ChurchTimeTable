import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type {
  MinistryDetail,
  MinistryLeadershipAssignment,
  MinistryLeadershipPosition,
  MinistryListItem,
  MinistryMemberRow,
  MinistryPermissionRow,
  MinistrySettings,
  MinistrySummary,
  MinistryActivityRow,
} from "@/features/ministries/types";

export async function fetchMinistries() {
  const res = await http.get<ApiEnvelope<MinistryListItem[]>>("/ministries");
  return res.data.data;
}

export async function fetchMinistry(id: string) {
  const res = await http.get<ApiEnvelope<MinistryDetail>>(`/ministries/${id}`);
  return res.data.data;
}

export async function fetchMinistrySummary(id: string) {
  const res = await http.get<ApiEnvelope<MinistrySummary>>(`/ministries/${id}/summary`);
  return res.data.data;
}

export async function fetchMinistryMembers(id: string, search?: string) {
  const res = await http.get<ApiEnvelope<MinistryMemberRow[]>>(`/ministries/${id}/members`, {
    params: search ? { search } : undefined,
  });
  return res.data.data;
}

export async function addMinistryMember(id: string, memberId: string, notes?: string) {
  const res = await http.post<ApiEnvelope<MinistryMemberRow>>(`/ministries/${id}/members`, {
    memberId,
    notes,
  });
  return res.data.data;
}

export async function removeMinistryMember(id: string, memberId: string) {
  const res = await http.delete<ApiEnvelope<MinistryMemberRow>>(
    `/ministries/${id}/members/${memberId}`,
  );
  return res.data.data;
}

export async function fetchMinistryLeadership(id: string) {
  const res = await http.get<
    ApiEnvelope<{
      current: MinistryLeadershipAssignment[];
      history: MinistryLeadershipAssignment[];
      positions: MinistryLeadershipPosition[];
    }>
  >(`/ministries/${id}/leadership`);
  return res.data.data;
}

export async function assignMinistryLeadership(
  id: string,
  input: { memberId: string; positionId: string },
) {
  const res = await http.post<ApiEnvelope<MinistryLeadershipAssignment>>(
    `/ministries/${id}/leadership`,
    input,
  );
  return res.data.data;
}

export async function endMinistryLeadership(id: string, assignmentId: string) {
  const res = await http.patch<ApiEnvelope<MinistryLeadershipAssignment>>(
    `/ministries/${id}/leadership/${assignmentId}`,
    {},
  );
  return res.data.data;
}

export async function fetchMinistryPermissions(id: string) {
  const res = await http.get<ApiEnvelope<MinistryPermissionRow[]>>(
    `/ministries/${id}/permissions`,
  );
  return res.data.data;
}

export async function grantMinistryPermission(
  id: string,
  input: { memberId: string; permission: string },
) {
  const res = await http.post<ApiEnvelope<MinistryPermissionRow>>(
    `/ministries/${id}/permissions`,
    input,
  );
  return res.data.data;
}

export async function revokeMinistryPermission(id: string, assignmentId: string) {
  const res = await http.delete<ApiEnvelope<unknown>>(
    `/ministries/${id}/permissions/${assignmentId}`,
  );
  return res.data.data;
}

export async function fetchMinistrySettings(id: string) {
  const res = await http.get<ApiEnvelope<MinistrySettings>>(`/ministries/${id}/settings`);
  return res.data.data;
}

export async function updateMinistrySettings(id: string, input: Partial<MinistrySettings>) {
  const res = await http.patch<ApiEnvelope<MinistrySettings>>(
    `/ministries/${id}/settings`,
    input,
  );
  return res.data.data;
}

export async function fetchMinistryActivity(id: string) {
  const res = await http.get<ApiEnvelope<MinistryActivityRow[]>>(
    `/ministries/${id}/activity`,
  );
  return res.data.data;
}
