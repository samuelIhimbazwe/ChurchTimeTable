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
  RotationPoolItem,
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
      signOut();
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

export async function logoutRequest() {
  try {
    await authHttp.post("/auth/logout");
  } finally {
    useSessionStore.getState().clearSession();
  }
}

export function signOut() {
  useSessionStore.getState().clearSession();
}

export { getApiErrorMessage };
