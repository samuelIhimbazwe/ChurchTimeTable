import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { ChoirRankingsResponse } from "@/features/executive-stewardship/types";

export async function getChoirRankings(limit = 15, params?: { from?: string; to?: string }) {
  const response = await http.get<ApiEnvelope<ChoirRankingsResponse>>(
    "/finance/contributions/rankings",
    { params: { limit, ...params } },
  );
  return response.data.data;
}
