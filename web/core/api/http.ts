import axios from "axios";

import { getApiErrorMessage } from "@/core/api/errors";
import { env } from "@/core/config/env";
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiMeta,
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
import { useChoirContextStore } from "@/core/auth/choir-context-store";

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

  const choirId = useChoirContextStore.getState().activeChoirId;
  if (choirId) {
    config.headers["x-choir-id"] = choirId;
  }

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
  churchRelationship?: "EXISTING" | "NEW_TO_CHURCH" | "VISITOR" | "RETURNING";
  interests?: string[];
  relationshipNotes?: string;
  preferredLanguage?: string;
}

export async function registerRequest(input: RegisterInput) {
  const response = await authHttp.post<ApiEnvelope<AuthTokenResponse>>("/auth/register", input);
  const token = response.data.data.accessToken;
  useSessionStore.getState().setAccessToken(token);
  return token;
}

export async function trackUxEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await http.post("/analytics/ux", { eventType, metadata });
  } catch {
    try {
      await http.post("/church/public/analytics", { eventType, metadata });
    } catch {
      /* best-effort analytics */
    }
  }
}

export async function fetchChurchWelcome() {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(
    "/church/public/welcome",
  );
  return response.data.data;
}

export async function fetchChurchBranding() {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(
    "/church/public/branding",
  );
  return response.data.data;
}

export async function fetchPublicChoirs() {
  const response = await http.get<ApiEnvelope<Array<Record<string, unknown>>>>(
    "/church/public/choirs",
  );
  return response.data.data ?? [];
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
  member: {
    id: string;
    memberNumber?: string | null;
    firstName: string;
    lastName: string;
    ministry: string;
  };
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
    thankYou?: {
      totalSent: number;
      totalPending: number;
      totalFailed: number;
      lastSentAt: string | null;
    };
    acknowledgmentQueue?: ContributionRecord[];
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
  thankYouSentAt?: string | null;
  thankYouSentById?: string | null;
  thankYouDeliveryStatus?: string;
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

export async function resendContributionThankYou(contributionId: string) {
  const response = await http.post<ApiEnvelope<ContributionRecord>>(
    `/finance/contributions/${contributionId}/resend-thank-you`,
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
    thankYouDeliveryStatus?: string | null;
    thankYouSentAt?: string | null;
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

export interface FamilyMemberSummary {
  id: string;
  memberNumber?: string | null;
  firstName: string;
  lastName: string;
  ministry?: string;
  status?: string;
}

export interface FamilySummary {
  id: string;
  familyCode: string;
  familyName: string;
  headMember: FamilyMemberSummary | null;
  memberCount: number;
  healthScore?: number;
  healthGrade?: string;
}

export interface FamilyMetricsPayload {
  familyId: string;
  familyCode: string;
  familyName: string;
  attendance: {
    attendanceRate: number;
    attendanceCount: number;
    missedCount: number;
  };
  contributions: {
    confirmedAmount: number;
    pendingAmount: number;
    contributionCount: number;
  } | null;
  participation: {
    activeAssignments: number;
    activeLeaders: number;
    activeMembers: number;
  };
  health: {
    score: number;
    grade: string;
  };
}

export interface FamilyMetricsOverview {
  totalFamilies: number;
  averageHealthScore: number;
  topFamilies: Array<{
    id: string;
    familyCode: string;
    familyName: string;
    score: number;
    grade: string;
  }>;
  needsAttention: Array<{
    id: string;
    familyCode: string;
    familyName: string;
    score: number;
    grade: string;
  }>;
}

export interface FamilyMemberRow {
  id: string;
  memberId: string;
  role: string;
  joinedAt: string;
  member: FamilyMemberSummary;
}

export interface FamilyDetail {
  id: string;
  familyCode: string;
  familyName: string;
  notes?: string | null;
  headMember: FamilyMemberSummary | null;
  members: FamilyMemberRow[];
}

export async function fetchFamilies(params?: {
  page?: number;
  limit?: number;
  includeMetrics?: boolean;
}) {
  const response = await http.get<ApiEnvelope<ApiListResponse<FamilySummary>>>(
    "/families",
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 100,
        includeMetrics: params?.includeMetrics ? "true" : undefined,
      },
    },
  );
  return response.data.data;
}

export async function fetchFamilyMetrics(id: string) {
  const response = await http.get<ApiEnvelope<FamilyMetricsPayload>>(
    `/families/${id}/metrics`,
  );
  return response.data.data;
}

export async function fetchFamilyMetricsOverview() {
  const response = await http.get<ApiEnvelope<FamilyMetricsOverview>>(
    "/families/metrics/overview",
  );
  return response.data.data;
}

export async function fetchFamily(id: string) {
  const response = await http.get<ApiEnvelope<FamilyDetail>>(`/families/${id}`);
  return response.data.data;
}

export async function createFamily(input: {
  familyName: string;
  headMemberId?: string;
  notes?: string;
}) {
  const response = await http.post<ApiEnvelope<FamilyDetail>>("/families", input);
  return response.data.data;
}

export async function updateFamily(
  id: string,
  input: {
    familyName?: string;
    headMemberId?: string | null;
    notes?: string | null;
  },
) {
  const response = await http.patch<ApiEnvelope<FamilyDetail>>(`/families/${id}`, input);
  return response.data.data;
}

export async function deleteFamily(id: string) {
  await http.delete(`/families/${id}`);
}

export async function addFamilyMember(
  familyId: string,
  input: { memberId: string; role?: string },
) {
  const response = await http.post<ApiEnvelope<FamilyDetail>>(
    `/families/${familyId}/members`,
    input,
  );
  return response.data.data;
}

export async function removeFamilyMember(familyId: string, memberId: string) {
  const response = await http.delete<ApiEnvelope<FamilyDetail>>(
    `/families/${familyId}/members/${memberId}`,
  );
  return response.data.data;
}

export interface SearchMemberResult {
  type: "member";
  id: string;
  memberNumber: string | null;
  displayName: string;
}

export interface SearchFamilyResult {
  type: "family";
  id: string;
  familyCode: string;
  familyName: string;
}

export interface SearchEventResult {
  type: "event";
  id: string;
  title: string;
}

export interface SearchAssignmentResult {
  type: "assignment";
  id: string;
  title: string;
}

export interface SearchContributionResult {
  type: "contribution";
  id: string;
  referenceNumber: string;
}

export interface SearchWelfareCaseResult {
  type: "welfareCase";
  id: string;
  title: string;
  status: string;
}

export interface SearchSongResult {
  type: "song";
  id: string;
  title: string;
}

export interface SearchRehearsalResult {
  type: "rehearsal";
  id: string;
  eventId: string;
  title: string;
}

export interface SearchResponse {
  query: string;
  members: SearchMemberResult[];
  families: SearchFamilyResult[];
  events: SearchEventResult[];
  assignments: SearchAssignmentResult[];
  contributions: SearchContributionResult[];
  welfareCases: SearchWelfareCaseResult[];
  welfareCategories: SearchWelfareCategoryResult[];
  songs: SearchSongResult[];
  rehearsals: SearchRehearsalResult[];
  choirDocuments: SearchChoirDocumentResult[];
  choirMeetings: SearchChoirMeetingResult[];
  meetingDecisions: SearchMeetingDecisionResult[];
  meetingActionItems: SearchMeetingActionItemResult[];
  songCategories: SearchSongCategoryResult[];
  welfareAssistance: SearchWelfareAssistanceResult[];
}

export interface SearchMeetingDecisionResult {
  type: "meetingDecision";
  id: string;
  meetingId: string;
  decision: string;
}

export interface SearchMeetingActionItemResult {
  type: "meetingActionItem";
  id: string;
  meetingId: string;
  title: string;
}

export interface SearchSongCategoryResult {
  type: "songCategory";
  id: string;
  name: string;
}

export interface SearchWelfareAssistanceResult {
  type: "welfareAssistance";
  id: string;
  caseId: string;
  description: string;
}

export interface SearchWelfareCategoryResult {
  type: "welfareCategory";
  id: string;
  name: string;
}

export interface SearchChoirDocumentResult {
  type: "choirDocument";
  id: string;
  title: string;
}

export interface SearchChoirMeetingResult {
  type: "choirMeeting";
  id: string;
  title: string;
}

export async function fetchSearch(query: string) {
  const response = await http.get<ApiEnvelope<SearchResponse>>("/search", {
    params: { q: query },
  });
  return response.data.data;
}

export async function fetchSearchSuggestions(query: string) {
  const response = await http.get<ApiEnvelope<SearchResponse>>("/search/suggestions", {
    params: { q: query },
  });
  return response.data.data;
}

export async function logoutRequest() {
  try {
    await authHttp.post("/auth/logout");
  } finally {
    useSessionStore.getState().clearSession();
  }
}

export async function updateMemberStatus(
  memberId: string,
  status: string,
  reason?: string,
) {
  const response = await http.patch<ApiEnvelope<MemberListItem>>(
    `/members/${memberId}/status`,
    { status, ...(reason ? { reason } : {}) },
  );
  return response.data.data;
}

export interface MemberProfileCenterPayload {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string | null;
    phone: string | null;
    ministry: string;
    status: string;
    createdAt: string;
    user?: { id: string; email: string } | null;
  };
  profile: {
    gender: string;
    voicePart: string;
    dateOfBirth: string | null;
    address: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    baptismDate: string | null;
    choirJoinDate: string | null;
    notes: string | null;
    skills: string[];
    instruments: string[];
  } | null;
  family: {
    familyId: string;
    familyName: string;
    familyCode: string;
    role: string;
  } | null;
  leadership: {
    familyRoles: Array<{
      familyId: string;
      familyName: string;
      familyCode: string;
      role: string;
      since: string;
    }>;
    choirCommitteeRoles: Array<{ roleName: string; assignedAt: string }>;
  };
  dashboard: {
    attendanceScore: {
      percentage: number;
      band: string;
      bandLabel: string;
      tone: string;
      weightedPoints: number;
      maxPoints: number;
      voluntaryBonus: number;
      breakdown: Record<string, number>;
    };
    contributionSummary: {
      confirmedCount: number;
      confirmedEffectiveTotal: number;
      pendingCount: number;
      pendingClaimedTotal: number;
    } | null;
    welfareSummary: { openCases: number } | null;
    upcomingAssignments: Array<{
      eventId: string;
      title: string;
      type: string;
      startTime: string;
      location: string | null;
    }>;
    recentAuditActivity: Array<{
      action: string;
      entity: string;
      createdAt: string;
    }>;
    statusHistoryPreview: Array<{
      id: string;
      fromStatus: string | null;
      toStatus: string;
      reason: string | null;
      createdAt: string;
    }>;
  };
  capabilities: {
    canEditProfile: boolean;
    canViewContributions: boolean;
    canViewWelfare: boolean;
    canViewDiscipline: boolean;
    canViewAttendanceDetail: boolean;
    canManageStatus: boolean;
  };
  allowedStatusTransitions: string[];
}

export interface MemberTimelineEventItem {
  type: string;
  timestamp: string;
  title: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface MemberTimelinePayload {
  memberId: string;
  memberName: string;
  attendanceScore: MemberProfileCenterPayload["dashboard"]["attendanceScore"];
  events: MemberTimelineEventItem[];
}

export async function fetchMemberProfileCenter(memberId: string) {
  const response = await http.get<ApiEnvelope<MemberProfileCenterPayload>>(
    `/members/${memberId}/profile`,
  );
  return response.data.data;
}

export async function fetchMemberTimeline(memberId: string, limit = 100) {
  const response = await http.get<ApiEnvelope<MemberTimelinePayload>>(
    `/members/${memberId}/timeline`,
    { params: { limit } },
  );
  return response.data.data;
}

export async function fetchMemberProfileAttendance(memberId: string) {
  const response = await http.get<
    ApiEnvelope<{
      allowed: boolean;
      score: MemberProfileCenterPayload["dashboard"]["attendanceScore"];
      records: MemberAttendanceHistory["records"];
      trends: MemberAttendanceHistory["trends"];
      latenessCount: number;
      voluntaryServiceCount: number;
    }>
  >(`/members/${memberId}/attendance`);
  return response.data.data;
}

export async function fetchMemberProfileContributions(
  memberId: string,
  page = 1,
  limit = 20,
) {
  const response = await http.get<
    ApiEnvelope<ApiListResponse<Record<string, unknown>>>
  >(`/members/${memberId}/contributions`, { params: { page, limit } });
  return response.data.data;
}

export async function fetchMemberProfileWelfareCases(memberId: string) {
  const response = await http.get<
    ApiEnvelope<{ items: Array<Record<string, unknown>>; meta: ApiMeta }>
  >(`/members/${memberId}/welfare-cases`);
  return response.data.data;
}

export async function fetchMemberStatusHistory(memberId: string, limit = 50) {
  const response = await http.get<
    ApiEnvelope<
      Array<{
        id: string;
        fromStatus: string | null;
        toStatus: string;
        reason: string | null;
        createdAt: string;
      }>
    >
  >(`/members/${memberId}/status-history`, { params: { limit } });
  return response.data.data;
}

export interface UpdateMemberProfileInput {
  gender?: string;
  voicePart?: string;
  dateOfBirth?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  baptismDate?: string | null;
  choirJoinDate?: string | null;
  notes?: string | null;
  skills?: string[];
  instruments?: string[];
}

export async function updateMemberProfile(
  memberId: string,
  input: UpdateMemberProfileInput,
) {
  const response = await http.patch<ApiEnvelope<MemberProfileCenterPayload["profile"]>>(
    `/members/${memberId}/profile`,
    input,
  );
  return response.data.data;
}

export interface WelfareCaseSummary {
  id: string;
  title: string;
  status: string;
  urgency: string;
  member: { id: string; firstName: string; lastName: string };
  category: { id: string; name: string };
}

export interface WelfareDashboardPayload {
  openCases: number;
  urgentCases: number;
  casesNearDeadline: number;
  fundsRaised: number;
  fundsNeeded: number;
  fundBalance: number;
}

export async function fetchWelfareDashboard() {
  const response = await http.get<ApiEnvelope<WelfareDashboardPayload>>(
    "/choir/welfare/dashboard",
  );
  return response.data.data;
}

export async function fetchWelfareCases(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const response = await http.get<
    ApiEnvelope<ApiListResponse<WelfareCaseSummary>>
  >("/choir/welfare/cases", { params });
  return response.data.data;
}

export interface WelfareCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface WelfareCaseDetail extends WelfareCaseSummary {
  description: string;
  familyId: string | null;
  requestedAmount: number | null;
  approvedAmount: number | null;
  raisedAmount: number;
  assistanceTotal: number;
  remainingAmount: number | null;
  targetDate: string | null;
  documentUrls: string[];
  supportPlan: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string | null;
  };
  category: { id: string; name: string };
  contributions: Array<{
    id: string;
    amount: number;
    paymentAt: string;
    isAnonymous: boolean;
    contributor?: { firstName: string; lastName: string };
  }>;
  assistance: Array<{
    id: string;
    assistanceType: string;
    amount: number | null;
    deliveredAt: string;
    notes: string | null;
  }>;
}

export interface WelfareTimelineEvent {
  type: string;
  at: string;
  label: string;
  meta?: Record<string, unknown>;
}

export async function fetchWelfareCategories() {
  const response = await http.get<ApiEnvelope<WelfareCategory[]>>(
    "/choir/welfare/categories",
  );
  return response.data.data;
}

export async function fetchWelfareCase(id: string) {
  const response = await http.get<ApiEnvelope<WelfareCaseDetail>>(
    `/choir/welfare/cases/${id}`,
  );
  return response.data.data;
}

export async function fetchWelfareCaseTimeline(id: string) {
  const response = await http.get<ApiEnvelope<WelfareTimelineEvent[]>>(
    `/choir/welfare/cases/${id}/timeline`,
  );
  return response.data.data;
}

export async function reviewWelfareCase(
  id: string,
  input: {
    action: "review" | "approve" | "reject" | "request_clarification";
    notes?: string;
    approvedAmount?: number;
  },
) {
  const response = await http.post<ApiEnvelope<WelfareCaseDetail>>(
    `/choir/welfare/cases/${id}/review`,
    input,
  );
  return response.data.data;
}

export async function submitWelfareContribution(input: {
  caseId: string;
  amount: number;
  isAnonymous?: boolean;
}) {
  const response = await http.post<ApiEnvelope<unknown>>(
    "/choir/welfare/my-contributions",
    input,
  );
  return response.data.data;
}

export async function createWelfareCase(input: {
  memberId: string;
  categoryId: string;
  title: string;
  description: string;
  familyId?: string;
  urgency?: string;
  requestedAmount?: number;
  targetDate?: string;
  documentUrls?: string[];
}) {
  const response = await http.post<ApiEnvelope<WelfareCaseSummary>>(
    "/choir/welfare/cases",
    input,
  );
  return response.data.data;
}

export function welfareCasesCsvUrl(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  return `/choir/welfare/reports/cases.csv${qs ? `?${qs}` : ""}`;
}

export function welfareCasesPdfUrl(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  return `/choir/welfare/reports/cases.pdf${qs ? `?${qs}` : ""}`;
}

export interface SongSummary {
  id: string;
  title: string;
  language: string | null;
  composer: string | null;
  category: { id: string; name: string } | null;
  usageCount: number;
}

export async function fetchMusicSongs(params?: {
  q?: string;
  page?: number;
  limit?: number;
}) {
  const response = await http.get<ApiEnvelope<ApiListResponse<SongSummary>>>(
    "/choir/music/songs",
    { params },
  );
  return response.data.data;
}

export interface SongDetail extends SongSummary {
  alternateTitle: string | null;
  arranger: string | null;
  year: number | null;
  lyricsText: string | null;
  notes: string | null;
  isFavorite: boolean;
  lastUsed: string | null;
  assets: Array<{
    id: string;
    assetType: string;
    fileName: string;
    fileUrl: string;
    mimeType: string | null;
  }>;
  usageRecords: Array<{
    usedAt: string;
    event: { id: string; title: string; startTime: string };
  }>;
}

export async function fetchMusicSong(id: string) {
  const response = await http.get<ApiEnvelope<SongDetail>>(
    `/choir/music/songs/${id}`,
  );
  return response.data.data;
}

export async function toggleMusicFavorite(songId: string) {
  const response = await http.post<ApiEnvelope<{ isFavorite: boolean }>>(
    `/choir/music/songs/${songId}/favorite`,
  );
  return response.data.data;
}

export async function fetchMusicFavorites() {
  const response = await http.get<ApiEnvelope<SongSummary[]>>(
    "/choir/music/favorites",
  );
  return response.data.data;
}

export async function fetchMusicAnalytics() {
  const response = await http.get<
    ApiEnvelope<{
      totalSongs: number;
      recentSongs: Array<{ id: string; title: string }>;
      mostUsed: Array<{ songId: string; title: string; usageCount: number }>;
      leastUsed?: Array<{ songId: string; title: string; usageCount: number }>;
      categoryDistribution?: Array<{ categoryId: string | null; _count: number }>;
      languageDistribution?: Array<{ language: string | null; _count: number }>;
    }>
  >("/choir/music/analytics");
  return response.data.data;
}

export async function fetchWelfareReports() {
  const response = await http.get<ApiEnvelope<WelfareReportsPayload>>(
    "/choir/welfare/reports",
  );
  return response.data.data;
}

export interface WelfareReportsPayload {
  summary: {
    activeCases: number;
    urgentCases: number;
    totalAssistance: number;
    totalContributions: number;
    completionRate: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  byCategory: Array<{
    categoryId: string;
    name: string;
    caseCount: number;
    raised: number;
    distributed: number;
  }>;
  byFamily: Array<{
    familyId: string;
    received: number;
    contributed: number;
    caseCount: number;
  }>;
  byMember: Array<{
    memberId: string;
    name: string;
    received: number;
    contributed: number;
  }>;
  monthly: Array<{
    month: string;
    activeCases: number;
    completedCases: number;
    raised: number;
  }>;
}

export async function fetchWelfareCaseAudit(caseId: string) {
  const response = await http.get<
    ApiEnvelope<
      Array<{
        id: string;
        action: string;
        createdAt: string;
        actor: string;
      }>
    >
  >(`/choir/welfare/cases/${caseId}/audit`);
  return response.data.data;
}

export async function transitionWelfareCase(
  caseId: string,
  input: { action: "submit" | "start_fundraising" | "complete" | "close"; notes?: string },
) {
  const response = await http.post<ApiEnvelope<WelfareCaseDetail>>(
    `/choir/welfare/cases/${caseId}/transition`,
    input,
  );
  return response.data.data;
}

export async function fetchRehearsalPlan(eventId: string) {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(
    `/choir/rehearsals/plans/${eventId}`,
  );
  return response.data.data;
}

export async function upsertRehearsalPlan(
  eventId: string,
  input: {
    objectives?: string;
    notes?: string;
    songs?: Array<{ songId: string; sortOrder?: number; estimatedMinutes?: number }>;
  },
) {
  const response = await http.put<ApiEnvelope<Record<string, unknown>>>(
    `/choir/rehearsals/plans/${eventId}`,
    input,
  );
  return response.data.data;
}

export async function fetchRehearsalAnalytics() {
  const response = await http.get<
    ApiEnvelope<{
      planCount: number;
      averageReadiness: number;
      attendanceByStatus: Array<{ status: string; _count: number }>;
    }>
  >("/choir/rehearsals/analytics");
  return response.data.data;
}

export async function fetchChoirReportsSummary() {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(
    "/choir/reports/summary",
  );
  return response.data.data;
}

export async function fetchRehearsalDashboard() {
  const response = await http.get<
    ApiEnvelope<{
      upcomingRehearsals: Array<{
        id: string;
        title: string;
        startTime: string;
        hasPlan: boolean;
        readiness: { overall: number };
      }>;
      attendanceRate: number;
      servicePrepScore: number;
      weakSongs: unknown[];
      frequentAbsent: Array<{ memberId: string; name: string; count: number }>;
    }>
  >("/choir/rehearsals/dashboard");
  return response.data.data;
}

export async function recordWelfareAssistance(input: {
  caseId: string;
  assistanceType: string;
  description: string;
  amount?: number;
  currency?: string;
  deliveredAt?: string;
}) {
  const response = await http.post<ApiEnvelope<unknown>>(
    "/choir/welfare/assistance",
    input,
  );
  return response.data.data;
}

export interface DevotionItem {
  id: string;
  title: string;
  content: string;
  verseReference?: string | null;
  verseText?: string | null;
  type: string;
  isPinned: boolean;
  publishedAt?: string | null;
}

export interface DevotionWidgetFeed {
  pinned: DevotionItem | null;
  verseOfDay: DevotionItem | null;
  encouragement: DevotionItem | null;
}

export async function fetchDevotionWidget() {
  const response = await http.get<ApiEnvelope<DevotionWidgetFeed>>(
    "/choir/devotions/widget",
  );
  return response.data.data;
}

export async function fetchDevotions(params?: { type?: string; pinned?: string }) {
  const response = await http.get<ApiEnvelope<DevotionItem[]>>("/choir/devotions", {
    params,
  });
  return response.data.data;
}

export async function fetchUserChoirs() {
  const response = await http.get<
    ApiEnvelope<Array<{ id: string; name: string; code: string; role: string }>>
  >("/choirs");
  return response.data.data;
}

export type ChurchSetupStep = {
  step: number;
  key: string;
  title: string;
};

export type ChurchSetupResponse = {
  config: Record<string, unknown>;
  totalSteps: number;
  steps: ChurchSetupStep[];
  readiness: Record<string, unknown>;
};

export async function fetchChurchSetup() {
  const response = await http.get<ApiEnvelope<ChurchSetupResponse>>("/setup");
  return response.data.data;
}

export async function saveChurchSetupStep(step: number, data: Record<string, unknown>) {
  const response = await http.post<ApiEnvelope<ChurchSetupResponse>>("/setup", {
    step,
    data,
  });
  return response.data.data;
}

export async function fetchChurchSetupStatus() {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>("/setup/status");
  return response.data.data;
}

export type ImportJobType =
  | "MEMBERS"
  | "CHOIR_MEMBERS"
  | "PROTOCOL_MEMBERS"
  | "MINISTRIES"
  | "MINISTRY_MEMBERS"
  | "LEADERSHIP_ASSIGNMENTS"
  | "ASSETS"
  | "SCHEDULES";

export type ImportConflictStrategy = "SKIP" | "REPLACE" | "MERGE" | "MANUAL_REVIEW";

export async function uploadImportPreview(type: ImportJobType, file: File) {
  const form = new FormData();
  form.append("type", type);
  form.append("file", file);
  const response = await http.post<ApiEnvelope<Record<string, unknown>>>("/imports", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data!;
}

export async function fetchImportJobs() {
  const response = await http.get<ApiEnvelope<Array<Record<string, unknown>>>>("/imports");
  return response.data.data ?? [];
}

export async function fetchImportJob(id: string) {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(`/imports/${id}`);
  return response.data.data!;
}

export async function confirmImportJob(
  id: string,
  conflictStrategy: ImportConflictStrategy,
) {
  const response = await http.post<ApiEnvelope<Record<string, unknown>>>(
    `/imports/${id}/confirm`,
    { conflictStrategy },
  );
  return response.data.data!;
}

export async function fetchRemindersDashboard() {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>("/reminders/dashboard");
  return response.data.data;
}

export async function fetchGoLiveReport() {
  const response = await http.get<ApiEnvelope<Record<string, unknown>>>(
    "/deployment/go-live-report",
  );
  return response.data.data;
}

export function signOut(options?: { reason?: "expired" | "manual" }) {
  useSessionStore.getState().clearSession(options?.reason);
}

export { getApiErrorMessage };
