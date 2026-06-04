import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { PersonalContributionTotals } from "@/features/contributions/types";

export async function getPersonalTotals() {
  const response = await http.get<ApiEnvelope<PersonalContributionTotals>>(
    "/finance/contributions/totals",
    { params: { scope: "own" } },
  );
  return response.data.data;
}
