import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { FamilyTotalsResponse } from "@/features/family-contributions/types";

export async function getFamilyTotals(familyId: string) {
  const response = await http.get<ApiEnvelope<FamilyTotalsResponse>>(
    "/finance/contributions/totals",
    { params: { familyId } },
  );
  return response.data.data;
}
