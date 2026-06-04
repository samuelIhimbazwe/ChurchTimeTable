import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";
import type {
  ContributionStatus,
  FamilyInboxResponse,
} from "@/features/family-contributions/types";

export async function getFamilyInbox(
  familyId: string,
  options?: { status?: ContributionStatus; limit?: number },
) {
  const response = await http.get<ApiEnvelope<FamilyInboxResponse>>(
    "/finance/contributions/family/inbox",
    {
      params: {
        familyId,
        status: options?.status,
        limit: options?.limit,
      },
    },
  );
  return response.data.data;
}
