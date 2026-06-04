import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type {
  MemberContributionRecord,
  SubmitContributionInput,
} from "@/features/contributions/types";

export async function submitContribution(input: SubmitContributionInput) {
  const response = await http.post<ApiEnvelope<MemberContributionRecord>>(
    "/finance/contributions/submit",
    input,
  );
  return response.data.data;
}
