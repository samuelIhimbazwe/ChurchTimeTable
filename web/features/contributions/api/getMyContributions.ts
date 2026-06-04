import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type {
  MemberContributionsListResponse,
  MemberContributionsQuery,
} from "@/features/contributions/types";

export async function getMyContributions(query: MemberContributionsQuery = {}) {
  const response = await http.get<ApiEnvelope<MemberContributionsListResponse>>(
    "/finance/contributions/member",
    { params: query },
  );
  return response.data.data;
}
