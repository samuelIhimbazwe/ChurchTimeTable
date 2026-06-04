import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type {
  ContributionCampaignOption,
  ContributionCatalogType,
} from "@/features/contributions/types";

export interface SubmitOptionsResponse {
  types: ContributionCatalogType[];
  campaigns: ContributionCampaignOption[];
}

export async function getSubmitOptions() {
  const response = await http.get<ApiEnvelope<SubmitOptionsResponse>>(
    "/finance/contributions/submit-options",
  );
  return response.data.data;
}
