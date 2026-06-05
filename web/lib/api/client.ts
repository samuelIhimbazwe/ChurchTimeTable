import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

/* ── Token storage (memory + localStorage backup) ── */
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) localStorage.setItem('cmms_access_token', token)
  else localStorage.removeItem('cmms_access_token')
}

export function getAccessToken(): string | null {
  return accessToken ?? localStorage.getItem('cmms_access_token')
}

/* ── Custom error types ── */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details)
    this.name = 'ConflictError'
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Session expired. Please sign in again.') {
    super(401, 'UNAUTHORIZED', message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public fields?: Record<string, string[]>) {
    super(422, 'VALIDATION_ERROR', message)
    this.name = 'ValidationError'
  }
}

/* ── Axios instance ── */
function resolveBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:3000'
  /* Support both http://localhost:3000 and .../api/v1 in env */
  return raw.replace(/\/api\/v1\/?$/, '')
}

const BASE_URL = resolveBaseUrl()

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  withCredentials: true,          // sends refresh cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/* ── Request interceptor: attach access token ── */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/* ── Refresh lock (prevent parallel refresh calls) ── */
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!),
  )
  refreshQueue = []
}

/* ── Response interceptor: unwrap envelope + handle errors ── */
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap { success, data, error } envelope
    if (response.data && 'data' in response.data) {
      return response.data.data
    }
    return response.data
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    /* 401 → attempt token refresh once (not on login/register) */
    const authPath = original.url ?? ''
    const isPublicAuth =
      authPath.includes('/auth/login') ||
      authPath.includes('/auth/register')

    if (error.response?.status === 401 && !original._retry && !isPublicAuth) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await axios.post<{ data: { accessToken: string } }>(
          `${BASE_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = res.data.data.accessToken
        setAccessToken(newToken)
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch (refreshError) {
        processQueue(refreshError)
        setAccessToken(null)
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(new AuthError())
      } finally {
        isRefreshing = false
      }
    }

    /* Map HTTP errors to typed errors */
    const data = error.response?.data as Record<string, unknown> | undefined
    const nestedError = data?.error
    const message: string =
      (typeof nestedError === 'object' &&
      nestedError !== null &&
      typeof (nestedError as Record<string, unknown>).message === 'string'
        ? (nestedError as Record<string, unknown>).message as string
        : undefined) ??
      (typeof data?.error === 'string' ? data.error : undefined) ??
      (typeof data?.message === 'string' ? data.message : undefined) ??
      error.message

    if (error.response?.status === 409) {
      return Promise.reject(new ConflictError(message, data))
    }
    if (error.response?.status === 422) {
      return Promise.reject(
        new ValidationError(
          message,
          data?.fields as Record<string, string[]> | undefined,
        ),
      )
    }
    if (error.response?.status === 401) {
      return Promise.reject(new AuthError(message))
    }

    return Promise.reject(
      new ApiError(
        error.response?.status ?? 0,
        typeof data?.code === 'string' ? data.code : 'UNKNOWN',
        message,
      ),
    )
  },
)
