import { http } from "@/core/api/http";
import type { ApiEnvelope } from "@/core/api/types";

export type ChurchHealthSummary = {
  ministryCount: number;
  activeMinistryCount: number;
  operationalUnitCount: number;
  activeOperationalUnitCount: number;
  totalMembers: number;
  activeMembers: number;
  leadershipAssignments: number;
  meetingsLast30Days: number;
  announcementsLast30Days: number;
  reportsGeneratedLast30Days: number;
  devotionsPublishedLast30Days: number;
  assetsCount: number;
  activeAssets: number;
  fundsCount: number;
  activeBudgets: number;
};

export type MinistryHealthScore = {
  ministryId: string;
  ministryName: string;
  ministryCode: string;
  overallScore: number;
  status: string;
  growthTrend: string;
};

export type GovernanceAlert = {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  ministryName?: string;
};

export async function fetchChurchHealthSummary() {
  const res = await http.get<ApiEnvelope<ChurchHealthSummary>>(
    "/church/intelligence/summary",
  );
  return res.data.data;
}

export async function fetchChurchDashboard() {
  const res = await http.get<ApiEnvelope<unknown>>(
    "/church/intelligence/dashboard",
  );
  return res.data.data;
}

export async function fetchMinistryHealthScores() {
  const res = await http.get<ApiEnvelope<MinistryHealthScore[]>>(
    "/church/intelligence/ministry-health",
  );
  return res.data.data;
}

export async function fetchGovernanceAlerts() {
  const res = await http.get<ApiEnvelope<GovernanceAlert[]>>(
    "/church/intelligence/alerts",
  );
  return res.data.data;
}

export async function fetchChurchActivity(limit = 30) {
  const res = await http.get<ApiEnvelope<unknown[]>>(
    `/church/activity?limit=${limit}`,
  );
  return res.data.data;
}

export async function fetchLeadershipAnalytics() {
  const res = await http.get<ApiEnvelope<unknown[]>>("/leadership/analytics");
  return res.data.data;
}

export async function fetchChurchReports() {
  const res = await http.get<ApiEnvelope<unknown[]>>(
    "/church/intelligence/reports",
  );
  return res.data.data;
}
