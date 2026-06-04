import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type { ContributionTimelineResponse } from "@/features/contributions/types";

export async function getContributionTimeline(contributionId: string) {
  const response = await http.get<ApiEnvelope<ContributionTimelineResponse>>(
    `/finance/contributions/${contributionId}/timeline`,
  );
  return response.data.data;
}
