import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { MemberContributionRecord } from "@/features/contributions/types";

export async function getContributionDetail(contributionId: string) {
  const response = await http.get<ApiEnvelope<MemberContributionRecord>>(
    `/finance/contributions/${contributionId}`,
  );
  return response.data.data;
}
