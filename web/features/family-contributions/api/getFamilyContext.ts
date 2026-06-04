import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { FamilyLeadershipContext } from "@/features/family-contributions/types";

export async function getFamilyContext() {
  const response = await http.get<ApiEnvelope<FamilyLeadershipContext>>(
    "/finance/contributions/family/context",
  );
  return response.data.data;
}
