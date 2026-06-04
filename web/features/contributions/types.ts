export type ContributionStatus =
  | "PENDING"
  | "SUBMITTED"
  | "CONFIRMED"
  | "REJECTED";

export type PaymentChannel = "MOMO" | "BANK" | "OTHER";

export interface ContributionAdjustment {
  id: string;
  adjustmentAmount: number;
  category: string;
  reason: string;
  createdAt: string;
}

export interface MemberContributionRecord {
  id: string;
  referenceNumber: string;
  status: ContributionStatus;
  memberId: string;
  memberNumber: string | null;
  memberName: string;
  ministryScope: string;
  familyId: string | null;
  familyCode: string | null;
  familyName: string | null;
  contributionTypeCatalogId: string | null;
  typeCode: string | null;
  typeName: string;
  contributionCampaignId: string | null;
  campaignName: string | null;
  claimedAmount: number;
  confirmedAmount: number | null;
  effectiveAmount: number | null;
  adjustmentTotal: number | null;
  discrepancyAmount: number | null;
  discrepancyReason: string | null;
  rejectionReason: string | null;
  currency: string;
  paymentAt: string | null;
  paymentChannel: PaymentChannel | null;
  receiptUrl: string | null;
  notes: string | null;
  familyApprovedAt: string | null;
  familyRejectedAt: string | null;
  thankYouDeliveryStatus: string | null;
  thankYouSentAt: string | null;
  financeTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  adjustments: ContributionAdjustment[];
}

export interface MemberContributionsListResponse {
  items: MemberContributionRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    confirmedEffectiveTotal: number;
    pendingClaimedTotal: number;
    confirmedCount: number;
    pendingCount: number;
  };
}

export interface ContributionTimelineEvent {
  type: string;
  timestamp: string;
  actorId?: string | null;
  actorRole?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface ContributionTimelineResponse {
  contributionId: string;
  referenceNumber: string;
  status: ContributionStatus;
  events: ContributionTimelineEvent[];
}

export interface ContributionCatalogType {
  id: string;
  code: string;
  name: string;
}

export interface ContributionCampaignOption {
  id: string;
  name: string;
  contributionTypeCatalogId: string;
  goalAmount: number;
  status: string;
}

export interface SubmitContributionInput {
  contributionTypeCatalogId: string;
  contributionCampaignId?: string;
  claimedAmount: number;
  paymentAt: string;
  paymentChannel: PaymentChannel;
  currency?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface PersonalContributionTotals {
  scope: string;
  pending: { count: number; claimedTotal: number };
  confirmed: { count: number; effectiveTotal: number };
}

export interface MemberContributionsQuery {
  page?: number;
  limit?: number;
  status?: ContributionStatus;
  contributionTypeCatalogId?: string;
  contributionCampaignId?: string;
}
