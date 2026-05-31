import axios from "axios";

import { getApiErrorMessage } from "@/core/api/errors";
import { env } from "@/core/config/env";
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiListResponse,
  AssignmentFormInput,
  AssignmentValidationResponse,
  AuthProfile,
  AuthTokenResponse,
  EventAssignment,
  EventFormInput,
  EventItem,
  LeaderDashboardSummary,
  MemberDashboardSummary,
  MinistryAlert,
  MinistryIntelligence,
  RotationPoolItem,
  AttendanceAnalytics,
  AttendanceRecordItem,
  AttendanceScore,
  AttendanceUpsertInput,
  CoordinatorAttendanceSummary,
  PresidentAttendanceSummary,
  TeamHeadAttendanceSummary,
  ChoirAttendanceSummary,
  MemberAttendanceHistory,
  DisciplineRecommendationsResponse,
  SwapItem,
  ReplacementItem,
  CoverageAnalytics,
  TeamHeadCoverageSummary,
  CoordinatorCoverageSummary,
  ServiceReadinessItem,
  CreateSwapInput,
  CreateReplacementInput,
} from "@/core/api/types";
import { useSessionStore } from "@/core/auth/session-store";

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

const authHttp = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let refreshPromise: Promise<string | null> | null = null;

function getPreferredLocaleHeader() {
  if (typeof document === "undefined") {
    return env.NEXT_PUBLIC_DEFAULT_LOCALE;
  }

  const [locale] = document.documentElement.lang.split("-");
  return locale || env.NEXT_PUBLIC_DEFAULT_LOCALE;
}

http.interceptors.request.use((config) => {
  const token = useSessionStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["Accept-Language"] = getPreferredLocaleHeader();

  return config;
});

authHttp.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = getPreferredLocaleHeader();
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const accessToken = await refreshSession();

    if (!accessToken) {
      signOut({ reason: "expired" });
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return http(originalRequest);
  },
);

export async function probeApiConnection() {
  try {
    await authHttp.get("/auth/me");
    return { reachable: true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { reachable: true, status: error.response.status };
    }

    return { reachable: false };
  }
}

export async function loginRequest(email: string, password: string) {
  const response = await authHttp.post<ApiEnvelope<AuthTokenResponse>>("/auth/login", {
    email,
    password,
  });

  const token = response.data.data.accessToken;
  useSessionStore.getState().setAccessToken(token);

  return token;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  ministry?: "CHOIR" | "PROTOCOL" | "BOTH";
  preferredLanguage?: string;
}

export async function registerRequest(input: RegisterInput) {
  const response = await authHttp.post<ApiEnvelope<AuthTokenResponse>>("/auth/register", input);
  const token = response.data.data.accessToken;
  useSessionStore.getState().setAccessToken(token);
  return token;
}

export async function completeOnboardingRequest() {
  const response = await http.patch<ApiEnvelope<{ onboardingCompleted: boolean }>>(
    "/auth/onboarding-complete",
  );
  return response.data.data;
}

export async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = authHttp
      .post<ApiEnvelope<AuthTokenResponse>>("/auth/refresh")
      .then((response) => {
        const token = response.data.data.accessToken;
        useSessionStore.getState().setAccessToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function fetchCurrentUser() {
  const response = await http.get<ApiEnvelope<AuthProfile>>("/auth/me");
  return response.data.data;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export async function updateProfileRequest(input: UpdateProfileInput) {
  const response = await http.patch<ApiEnvelope<AuthProfile>>("/users/me", input);
  return response.data.data;
}

export async function fetchLeaderDashboard() {
  const response = await http.get<ApiEnvelope<LeaderDashboardSummary>>(
    "/dashboard/leader-summary",
  );
  return response.data.data;
}

export async function fetchMemberDashboard() {
  const response = await http.get<ApiEnvelope<MemberDashboardSummary>>(
    "/dashboard/member-summary",
  );
  return response.data.data;
}

export async function fetchAdminDashboard() {
  const response = await http.get<ApiEnvelope<AdminDashboardSummary>>(
    "/dashboard/admin-summary",
  );
  return response.data.data;
}

export async function fetchDashboardIntelligence() {
  const response = await http.get<ApiEnvelope<MinistryIntelligence & { alerts: MinistryAlert[]; generatedAt: string }>>(
    "/dashboard/intelligence",
  );
  return response.data.data;
}

export async function fetchOperationalDashboard(role: "team-head" | "coordinator" | "president" | "choir-leader") {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(
    `/dashboard/operational/${role}`,
  );
  return response.data.data;
}

export async function fetchEvents(params: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  ministryScope?: string;
  type?: string;
}) {
  const response = await http.get<ApiEnvelope<ApiListResponse<EventItem>>>("/events", {
    params,
  });
  return response.data.data;
}

export async function createEvent(input: EventFormInput) {
  const response = await http.post<ApiEnvelope<EventItem>>("/events", input);
  return response.data.data;
}

export async function updateEvent(eventId: string, input: Partial<EventFormInput>) {
  const response = await http.patch<ApiEnvelope<EventItem>>(`/events/${eventId}`, input);
  return response.data.data;
}

export async function cancelEvent(eventId: string) {
  const response = await http.patch<ApiEnvelope<EventItem>>(`/events/${eventId}/cancel`);
  return response.data.data;
}

export async function fetchEventAssignments(eventId: string, page = 1, limit = 50) {
  const response = await http.get<ApiEnvelope<ApiListResponse<EventAssignment>>>(
    `/assignments/event/${eventId}`,
    { params: { page, limit } },
  );
  return response.data.data;
}

export async function validateAssignment(input: AssignmentFormInput) {
  const response = await http.post<AssignmentValidationResponse>(
    "/assignments/validate",
    input,
  );
  return response.data;
}

export async function createAssignment(input: AssignmentFormInput) {
  const response = await http.post<ApiEnvelope<EventAssignment>>("/assignments", input);
  return response.data.data;
}

export async function bulkAssign(
  assignments: AssignmentFormInput[],
): Promise<{
  results: Array<{
    memberId: string;
    eventId: string;
    status: "ok" | "error";
    error?: string;
  }>;
}> {
  const response = await http.post<
    ApiEnvelope<{
      results: Array<{
        memberId: string;
        eventId: string;
        status: "ok" | "error";
        error?: string;
      }>;
    }>
  >("/assignments/bulk", { assignments });
  return response.data.data;
}

export async function fetchChoirRotationPool(eventId: string) {
  const response = await http.get<ApiEnvelope<RotationPoolItem[]>>(
    `/choir/rotation/pool/${eventId}`,
  );
  return response.data.data;
}

export async function autoAssignChoirRotation(eventId: string, count: number) {
  const response = await http.post<ApiEnvelope<{ created: number }>>(
    `/choir/rotation/events/${eventId}/assign`,
    { count },
  );
  return response.data.data;
}

export async function fetchAttendanceByEvent(eventId: string) {
  const response = await http.get<ApiEnvelope<ApiListResponse<AttendanceRecordItem>>>(
    `/attendance/event/${eventId}`,
    { params: { page: 1, limit: 200 } },
  );
  return response.data.data;
}

export async function upsertAttendance(input: AttendanceUpsertInput) {
  const response = await http.put<ApiEnvelope<AttendanceRecordItem>>("/attendance", input);
  return response.data.data;
}

export async function submitSelfExcusedAbsence(input: {
  eventId: string;
  reasonType: string;
  excuseReason?: string;
  excuseEvidenceUrl?: string;
  notes?: string;
}) {
  const response = await http.post<ApiEnvelope<AttendanceRecordItem>>(
    "/attendance/self/excused",
    input,
  );
  return response.data.data;
}

export async function createDisciplineCase(input: {
  memberId: string;
  ministry: "PROTOCOL" | "CHOIR" | "BOTH";
  title: string;
  description: string;
}) {
  const response = await http.post<ApiEnvelope<{ id: string }>>("/discipline", input);
  return response.data.data;
}

export async function bulkUpsertAttendance(records: AttendanceUpsertInput[]) {
  const response = await http.post<
    ApiEnvelope<{
      results: Array<{ memberId: string; status: "ok" | "error"; error?: string }>;
      applied: number;
    }>
  >("/attendance/bulk", { records });
  return response.data.data;
}

export async function approveExcusedAttendance(attendanceId: string, approve: boolean) {
  const response = await http.patch<ApiEnvelope<AttendanceRecordItem>>(
    `/attendance/${attendanceId}/excused-review`,
    { approve },
  );
  return response.data.data;
}

export async function escalateAttendance(
  attendanceId: string,
  level: "TEAM_HEAD" | "COORDINATOR" | "PRESIDENT",
  notes?: string,
) {
  const response = await http.post<ApiEnvelope<AttendanceRecordItem>>(
    `/attendance/${attendanceId}/escalate`,
    { level, notes },
  );
  return response.data.data;
}

export async function fetchMemberAttendanceScore(memberId: string) {
  const response = await http.get<ApiEnvelope<AttendanceScore>>(
    `/attendance/member/${memberId}/score`,
  );
  return response.data.data;
}

export async function fetchAttendanceAnalytics() {
  const response = await http.get<ApiEnvelope<AttendanceAnalytics>>("/attendance/analytics");
  return response.data.data;
}

export async function fetchTeamHeadAttendanceSummary() {
  const response = await http.get<ApiEnvelope<TeamHeadAttendanceSummary>>(
    "/attendance/operational/team-head",
  );
  return response.data.data;
}

export async function fetchCoordinatorAttendanceSummary() {
  const response = await http.get<ApiEnvelope<CoordinatorAttendanceSummary>>(
    "/attendance/operational/coordinator",
  );
  return response.data.data;
}

export async function fetchPresidentAttendanceSummary() {
  const response = await http.get<ApiEnvelope<PresidentAttendanceSummary>>(
    "/attendance/operational/president",
  );
  return response.data.data;
}

export async function fetchChoirAttendanceSummary() {
  const response = await http.get<ApiEnvelope<ChoirAttendanceSummary>>(
    "/attendance/operational/choir",
  );
  return response.data.data;
}

export async function fetchMemberAttendanceHistory(memberId: string) {
  const response = await http.get<ApiEnvelope<MemberAttendanceHistory>>(
    `/attendance/member/${memberId}/history`,
  );
  return response.data.data;
}

export async function fetchDisciplineRecommendations() {
  const response = await http.get<ApiEnvelope<DisciplineRecommendationsResponse>>(
    "/attendance/discipline-recommendations",
  );
  return response.data.data;
}

export async function fetchAttendanceScoringWeights() {
  const response = await http.get<ApiEnvelope<Record<string, number>>>(
    "/attendance/scoring/weights",
  );
  return response.data.data;
}

export async function updateAttendanceScoringWeights(
  weights: Record<string, number>,
) {
  const response = await http.patch<ApiEnvelope<Record<string, number>>>(
    "/attendance/scoring/weights",
    { weights },
  );
  return response.data.data;
}

export async function fetchSwaps(page = 1, limit = 50) {
  const response = await http.get<ApiEnvelope<ApiListResponse<SwapItem>>>("/swaps", {
    params: { page, limit },
  });
  return response.data.data;
}

export async function createSwap(input: CreateSwapInput) {
  const response = await http.post<ApiEnvelope<SwapItem>>("/swaps", input);
  return response.data.data;
}

export async function respondToSwap(swapId: string, accept: boolean) {
  const response = await http.patch<ApiEnvelope<SwapItem>>(`/swaps/${swapId}/respond`, {
    accept,
  });
  return response.data.data;
}

export async function approveSwap(swapId: string, notes?: string) {
  const response = await http.patch<ApiEnvelope<SwapItem>>(`/swaps/${swapId}/approve`, {
    notes,
  });
  return response.data.data;
}

export async function rejectSwap(swapId: string, notes?: string) {
  const response = await http.patch<ApiEnvelope<SwapItem>>(`/swaps/${swapId}/reject`, {
    notes,
  });
  return response.data.data;
}

export async function finalizeSwap(swapId: string) {
  const response = await http.patch<ApiEnvelope<SwapItem>>(`/swaps/${swapId}/finalize`, {});
  return response.data.data;
}

export async function fetchReplacements(page = 1, limit = 50) {
  const response = await http.get<ApiEnvelope<ApiListResponse<ReplacementItem>>>(
    "/replacements",
    { params: { page, limit } },
  );
  return response.data.data;
}

export async function createReplacement(input: CreateReplacementInput) {
  const response = await http.post<ApiEnvelope<ReplacementItem>>("/replacements", input);
  return response.data.data;
}

export async function approveReplacement(replacementId: string, notes?: string) {
  const response = await http.patch<ApiEnvelope<ReplacementItem>>(
    `/replacements/${replacementId}/approve`,
    { notes },
  );
  return response.data.data;
}

export async function rejectReplacement(replacementId: string, notes?: string) {
  const response = await http.patch<ApiEnvelope<ReplacementItem>>(
    `/replacements/${replacementId}/reject`,
    { notes },
  );
  return response.data.data;
}

export async function finalizeReplacement(replacementId: string) {
  const response = await http.patch<ApiEnvelope<ReplacementItem>>(
    `/replacements/${replacementId}/finalize`,
    {},
  );
  return response.data.data;
}

export async function fetchCoverageAnalytics() {
  const response = await http.get<ApiEnvelope<CoverageAnalytics>>("/coverage/analytics");
  return response.data.data;
}

export async function fetchTeamHeadCoverageSummary() {
  const response = await http.get<ApiEnvelope<TeamHeadCoverageSummary>>(
    "/coverage/operational/team-head",
  );
  return response.data.data;
}

export async function fetchCoordinatorCoverageSummary() {
  const response = await http.get<ApiEnvelope<CoordinatorCoverageSummary>>(
    "/coverage/operational/coordinator",
  );
  return response.data.data;
}

export async function fetchCoverageReadiness() {
  const response = await http.get<ApiEnvelope<ServiceReadinessItem[]>>("/coverage/readiness");
  return response.data.data;
}

export async function escalateCoverageSwap(
  swapId: string,
  level: "TEAM_HEAD" | "COORDINATOR" | "PRESIDENT",
  reason?: string,
) {
  const response = await http.post<ApiEnvelope<SwapItem>>(`/coverage/swaps/${swapId}/escalate`, {
    level,
    reason,
  });
  return response.data.data;
}

export async function escalateCoverageReplacement(
  replacementId: string,
  level: "TEAM_HEAD" | "COORDINATOR" | "PRESIDENT",
  reason?: string,
) {
  const response = await http.post<ApiEnvelope<ReplacementItem>>(
    `/coverage/replacements/${replacementId}/escalate`,
    { level, reason },
  );
  return response.data.data;
}

export interface CommitteeRoleRecord {
  id: string;
  name: string;
  permissionsJson: string[];
}

export interface CommitteeMemberAssignment {
  id: string;
  memberId: string;
  roleId: string;
  member: { id: string; firstName: string; lastName: string; ministry: string };
  role: { id: string; name: string };
}

export interface CommitteeGovernanceSnapshot {
  roles: CommitteeRoleRecord[];
  members: CommitteeMemberAssignment[];
}

export interface MemberListItem {
  id: string;
  memberNumber?: string | null;
  firstName: string;
  lastName: string;
  ministry: string;
  status: string;
  createdAt?: string;
  user?: { email: string | null };
}

export interface MemberRosterItem {
  id: string;
  firstName: string;
  lastName: string;
  memberNumber?: string | null;
  ministry: string;
  status: string;
}

export async function fetchMembersRoster(params?: {
  page?: number;
  limit?: number;
  ministry?: string;
  status?: string;
}) {
  const response = await http.get<ApiEnvelope<ApiListResponse<MemberRosterItem>>>(
    "/members/roster",
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 200,
        ministry: params?.ministry,
        status: params?.status ?? "ACTIVE",
      },
    },
  );
  return response.data.data;
}

export async function fetchMembers(params?: {
  page?: number;
  limit?: number;
  ministry?: string;
  status?: string;
  includeAllStatuses?: boolean;
}) {
  const response = await http.get<ApiEnvelope<ApiListResponse<MemberListItem>>>(
    "/members",
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 200,
        ministry: params?.ministry,
        ...(params?.includeAllStatuses
          ? {}
          : { status: params?.status ?? "ACTIVE" }),
      },
    },
  );
  return response.data.data;
}

export async function fetchProtocolCommittee(scopeId: string) {
  const response = await http.get<ApiEnvelope<CommitteeGovernanceSnapshot>>(
    `/governance/protocol/${scopeId}`,
  );
  return response.data.data;
}

export async function fetchChoirCommittee(scopeId: string) {
  const response = await http.get<ApiEnvelope<CommitteeGovernanceSnapshot>>(
    `/governance/choir/${scopeId}`,
  );
  return response.data.data;
}

export async function assignProtocolCommitteeMember(input: {
  scopeId: string;
  memberId: string;
  roleId: string;
}) {
  const response = await http.post<ApiEnvelope<CommitteeMemberAssignment>>(
    "/governance/protocol/members",
    input,
  );
  return response.data.data;
}

export async function assignChoirCommitteeMember(input: {
  scopeId: string;
  memberId: string;
  roleId: string;
}) {
  const response = await http.post<ApiEnvelope<CommitteeMemberAssignment>>(
    "/governance/choir/members",
    input,
  );
  return response.data.data;
}

export interface FinanceStewardshipAnalytics {
  ministryScopes: string[];
  executiveSummary: boolean;
  balance: number;
  income: number;
  expense: number;
  unpaidBalance: number;
  unpaidMemberCount: number;
  complianceRate: number;
  unpaidMembers: Array<{
    memberId: string;
    name: string;
    period: string;
    amountDue: number;
    status: string;
  }>;
  budgets: Array<{
    id: string;
    name: string;
    ministryScope: string;
    planned: number;
    actual: number;
    remaining: number;
    overBudget: boolean;
  }>;
  monthlyTrend: Array<{ label: string; income: number; expense: number }>;
  recentTransactions: FinanceTransactionRow[];
  alerts: Array<{ id: string; severity: string; title: string; message: string }>;
  contributions?: {
    contributionTotals: number;
    confirmedCount: number;
    pendingConfirmationCount: number;
    contributionGrowth: Array<{ label: string; total: number }>;
    contributionTypeDistribution: Array<{
      contributionType: string;
      total: number;
    }>;
    confirmationQueue: ContributionRecord[];
  };
}

export interface ContributionRecord {
  id: string;
  memberId: string;
  memberNumber?: string | null;
  memberName?: string;
  ministryScope?: string;
  familyId?: string | null;
  financeTransactionId?: string | null;
  memberDueId?: string | null;
  contributionType: string;
  amount: number;
  currency: string;
  status: string;
  referenceNumber: string;
  notes?: string | null;
  receiptUrl?: string | null;
  confirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceTransactionRow {
  id: string;
  type: string;
  category?: string;
  amount: number;
  ministryScope: string;
  transactionDate: string;
  description?: string | null;
  approvalStatus: string;
  receiptUrl?: string | null;
}

export async function fetchFinanceStewardshipAnalytics(ministryScope?: string) {
  const response = await http.get<ApiEnvelope<FinanceStewardshipAnalytics>>(
    "/finance/stewardship/analytics",
    { params: ministryScope ? { ministryScope } : undefined },
  );
  return response.data.data;
}

export async function approveFinanceTransaction(transactionId: string, approve: boolean) {
  const response = await http.post<ApiEnvelope<FinanceTransactionRow>>(
    `/finance/transactions/${transactionId}/approve`,
    { approve },
  );
  return response.data.data;
}

export interface MyContributionsPayload {
  memberNumber?: string | null;
  summary: {
    totalContributed: number;
    outstandingBalance: number;
    consistencyRate: number;
    totalObligations: number;
    paidCount: number;
    unpaidCount: number;
    upToDate: boolean;
  };
  byMinistry: Array<{
    ministryScope: string;
    contributed: number;
    outstanding: number;
    obligationCount: number;
  }>;
  history: Array<{
    id: string;
    date: string;
    ministryScope: string;
    contributionType: string;
    period: string | null;
    amount: number;
    status: string;
    receiptUrl: string | null;
    referenceNumber?: string | null;
    source?: string;
  }>;
  reminders: Array<{
    id: string;
    ministryScope: string;
    dueType: string;
    period: string;
    amountDue: number;
    remaining: number;
    status: string;
  }>;
  contributionRecords?: ContributionRecord[];
  contributionTotals?: {
    confirmed: number;
    pending: number;
    rejected: number;
  };
  contributionByType?: Array<{
    contributionType: string;
    total: number;
    confirmed: number;
    count: number;
  }>;
  dues: unknown[];
  transactions: unknown[];
}

export async function fetchMyContributionsSummary() {
  const response = await http.get<
    ApiEnvelope<{
      memberNumber?: string | null;
      totals: MyContributionsPayload["contributionTotals"];
      byType: MyContributionsPayload["contributionByType"];
      recentCount: number;
    }>
  >("/finance/my-contributions/summary");
  return response.data.data;
}

export async function fetchMyContributions() {
  const response = await http.get<ApiEnvelope<MyContributionsPayload>>(
    "/finance/contributions/mine",
  );
  return response.data.data;
}

async function downloadBlob(path: string, filename: string, params?: Record<string, string>) {
  const response = await http.get(path, {
    params,
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadMemberContributionsCsv() {
  await downloadBlob(
    "/finance/contributions/mine/export/csv",
    `my-contributions-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

export async function downloadMemberContributionsPdf() {
  await downloadBlob(
    "/finance/contributions/mine/export/pdf",
    `my-contributions-${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}

export async function downloadMinistryFinanceCsv(params: {
  ministryScope?: string;
  from?: string;
  to?: string;
}) {
  const scope = params.ministryScope?.toLowerCase() ?? "ministry";
  await downloadBlob("/finance/export/csv", `finance-${scope}.csv`, params as Record<string, string>);
}

export async function downloadMinistryFinancePdf(params: {
  ministryScope?: string;
  from?: string;
  to?: string;
}) {
  const scope = params.ministryScope?.toLowerCase() ?? "ministry";
  await downloadBlob("/finance/export/pdf", `finance-${scope}.pdf`, params as Record<string, string>);
}

export async function logoutRequest() {
  try {
    await authHttp.post("/auth/logout");
  } finally {
    useSessionStore.getState().clearSession();
  }
}

export async function updateMemberStatus(memberId: string, status: string) {
  const response = await http.patch<ApiEnvelope<MemberListItem>>(
    `/members/${memberId}/status`,
    { status },
  );
  return response.data.data;
}

export function signOut(options?: { reason?: "expired" | "manual" }) {
  useSessionStore.getState().clearSession(options?.reason);
}

export { getApiErrorMessage };
