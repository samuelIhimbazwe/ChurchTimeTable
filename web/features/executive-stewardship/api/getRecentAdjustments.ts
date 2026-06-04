import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { RecentAdjustmentsResponse } from "@/features/executive-stewardship/types";

export async function getRecentAdjustments(limit = 15) {
  const response = await http.get<ApiEnvelope<RecentAdjustmentsResponse>>(
    "/finance/contributions/adjustments/recent",
    { params: { limit } },
  );
  return response.data.data;
}
