import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { ApproveContributionInput } from "@/features/family-contributions/types";

export async function approveContribution(
  contributionId: string,
  input: ApproveContributionInput,
) {
  const response = await http.post<ApiEnvelope<unknown>>(
    `/finance/contributions/${contributionId}/family/approve`,
    input,
  );
  return response.data.data;
}
