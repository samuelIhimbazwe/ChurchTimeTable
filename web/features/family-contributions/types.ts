import type {
  ContributionStatus,
  MemberContributionRecord,
} from "@/features/contributions/types";

export type FamilyLeadershipRole = "HEAD" | "ASSISTANT_HEAD" | "SECRETARY";

export interface FamilyLeadershipContextItem {
  familyId: string;
  familyCode: string | null;
  familyName: string;
  role: FamilyLeadershipRole;
  delegationEnabled: boolean;
  canApprove: boolean;
  canViewInbox: boolean;
  isViewOnly: boolean;
}

export interface FamilyLeadershipContext {
  families: FamilyLeadershipContextItem[];
  requiresFamilyPicker: boolean;
  canViewAllFamilies: boolean;
}

export interface FamilyInboxItem {
  id: string;
  referenceNumber: string;
  status: ContributionStatus;
  claimedAmount: number;
  confirmedAmount: number | null;
  memberId: string;
  memberName: string;
  memberNumber: string | null;
  typeName: string;
  campaignName: string | null;
  paymentAt: string | null;
  createdAt: string;
}

export interface FamilyInboxResponse {
  familyId: string;
  pendingCount: number;
  items: FamilyInboxItem[];
}

export interface FamilyTotalsResponse {
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
    status: string;
    goalAmount: number;
    confirmedEffective: number;
    progressPct: number;
  }>;
}

export interface FamilyRankingsResponse {
  scope: string;
  familyId: string | null;
  topFamilies: Array<{
    familyId: string;
    familyCode: string | null;
    familyName: string;
    effectiveTotal: number;
  }>;
  topContributors: Array<{
    memberId: string;
    memberNumber: string | null;
    memberName: string;
    effectiveTotal: number;
  }>;
  needsAttention: Array<{
    familyId: string;
    familyCode: string | null;
    familyName: string;
    effectiveTotal: number;
    pendingCount: number;
    lowestCampaignProgressPct: number | null;
    flagged: boolean;
    reasons: string[];
  }>;
}

export interface ApproveContributionInput {
  confirmedAmount: number;
  discrepancyReason?: string;
}

export interface RejectContributionInput {
  rejectionReason: string;
}

export type { ContributionStatus, MemberContributionRecord };
