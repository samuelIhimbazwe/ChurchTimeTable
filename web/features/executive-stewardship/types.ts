export type CampaignReportingStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface ChoirTotalsResponse {
  scope: string;
  familyId: string | null;
  pending: { count: number; claimedTotal: number };
  confirmed: { count: number; effectiveTotal: number };
  byType: Array<{
    catalogId: string;
    code: string;
    name: string;
    pendingClaimed: number;
    confirmedEffective: number;
  }>;
  byCampaign: Array<{
    campaignId: string;
    name: string;
    status: CampaignReportingStatus;
    goalAmount: number;
    confirmedEffective: number;
    progressPct: number;
  }>;
  byFamily?: Array<{
    familyId: string;
    confirmedEffective: number;
  }>;
}

export interface ChoirRankingsResponse {
  scope: string;
  familyId: string | null;
  topFamilies: Array<{
    familyId: string;
    familyCode: string | null;
    familyName: string;
    effectiveTotal: number;
    goalProgressPct: number | null;
  }>;
  topContributors: Array<{
    memberId: string;
    memberNumber: string | null;
    memberName: string;
    effectiveTotal: number;
    familyId: string | null;
    familyCode: string | null;
    familyName: string | null;
  }>;
  needsAttention: Array<{
    familyId: string;
    familyCode: string | null;
    familyName: string;
    effectiveTotal: number;
    pendingCount: number;
    lowestCampaignProgressPct: number | null;
    reasons: string[];
  }>;
}

export type AdjustmentCategory =
  | "CORRECTION"
  | "TRANSFER"
  | "REVERSAL"
  | "MISCLASSIFICATION"
  | "OTHER";

export interface RecentAdjustmentItem {
  adjustmentId: string;
  contributionId: string;
  referenceNumber: string;
  adjustmentAmount: number;
  category: AdjustmentCategory;
  reason: string;
  createdAt: string;
  memberId: string;
  memberNumber: string | null;
  memberName: string;
  familyId: string | null;
  familyCode: string | null;
  familyName: string | null;
  campaignName: string | null;
}

export interface RecentAdjustmentsResponse {
  items: RecentAdjustmentItem[];
}
