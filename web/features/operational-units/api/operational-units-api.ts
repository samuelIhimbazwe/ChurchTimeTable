import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { OperationalUnitListItem } from "@/features/operational-units/types";

export async function fetchOperationalUnits(ministryId?: string) {
  const res = await http.get<ApiEnvelope<OperationalUnitListItem[]>>(
    "/operational-units",
    { params: ministryId ? { ministryId } : undefined },
  );
  return res.data.data;
}

export async function fetchOperationalUnit(id: string) {
  const res = await http.get<ApiEnvelope<OperationalUnitListItem & Record<string, unknown>>>(
    `/operational-units/${id}`,
  );
  return res.data.data;
}

export async function fetchOperationalUnitSummary(id: string) {
  const res = await http.get<ApiEnvelope<Record<string, unknown>>>(
    `/operational-units/${id}/summary`,
  );
  return res.data.data;
}

export async function fetchOperationalUnitMembers(id: string, search?: string) {
  const res = await http.get<ApiEnvelope<unknown[]>>(`/operational-units/${id}/members`, {
    params: search ? { search } : undefined,
  });
  return res.data.data;
}

export async function fetchOperationalUnitLeadership(id: string) {
  const res = await http.get<ApiEnvelope<Record<string, unknown>>>(
    `/operational-units/${id}/leadership`,
  );
  return res.data.data;
}

export async function fetchOperationalUnitPermissions(id: string) {
  const res = await http.get<ApiEnvelope<unknown[]>>(
    `/operational-units/${id}/permissions`,
  );
  return res.data.data;
}

export async function fetchOperationalUnitSettings(id: string) {
  const res = await http.get<ApiEnvelope<Record<string, boolean>>>(
    `/operational-units/${id}/settings`,
  );
  return res.data.data;
}

export async function updateOperationalUnitSettings(
  id: string,
  input: Record<string, boolean>,
) {
  const res = await http.patch<ApiEnvelope<Record<string, boolean>>>(
    `/operational-units/${id}/settings`,
    input,
  );
  return res.data.data;
}

export async function fetchOperationalUnitActivity(id: string) {
  const res = await http.get<ApiEnvelope<unknown[]>>(
    `/operational-units/${id}/activity`,
  );
  return res.data.data;
}
