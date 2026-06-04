import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { RejectContributionInput } from "@/features/family-contributions/types";

export async function rejectContribution(
  contributionId: string,
  input: RejectContributionInput,
) {
  const response = await http.post<ApiEnvelope<unknown>>(
    `/finance/contributions/${contributionId}/family/reject`,
    input,
  );
  return response.data.data;
}
