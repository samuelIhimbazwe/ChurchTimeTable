import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export async function fetchOperationsDashboard() {
  const res = await http.get<ApiEnvelope<unknown>>("/operations/dashboard");
  return res.data.data;
}

export async function fetchOperationTemplates() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/operations/templates");
  return res.data.data;
}

export async function fetchOperationOccurrences() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/operations/occurrences");
  return res.data.data;
}

export async function fetchMyOperationAssignments() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/operations/my-assignments");
  return res.data.data;
}
