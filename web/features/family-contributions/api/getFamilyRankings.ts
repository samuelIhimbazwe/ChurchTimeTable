import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { FamilyRankingsResponse } from "@/features/family-contributions/types";

export async function getFamilyRankings(familyId: string, limit = 10) {
  const response = await http.get<ApiEnvelope<FamilyRankingsResponse>>(
    "/finance/contributions/rankings",
    { params: { familyId, limit } },
  );
  return response.data.data;
}
