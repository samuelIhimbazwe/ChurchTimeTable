import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { ChoirTotalsResponse } from "@/features/executive-stewardship/types";

export async function getChoirTotals(params?: {
  from?: string;
  to?: string;
}) {
  const response = await http.get<ApiEnvelope<ChoirTotalsResponse>>(
    "/finance/contributions/totals",
    { params: { scope: "choir", ...params } },
  );
  return response.data.data;
}
