import { apiClient, setAccessToken } from '../client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  nationalId: string
  acceptedTerms: boolean
  churchRelationship?: string
  interests?: string[]
  relationshipNotes?: string
  preferredLanguage?: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  onboardingComplete: boolean
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

interface MeResponse {
  id: string
  email: string
  roles: string[]
  permissions: string[]
  onboardingCompleted: boolean
  preferredLanguage?: string
  member?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

function mapMeToAuthUser(me: MeResponse): AuthUser {
  const name = me.member
    ? `${me.member.firstName} ${me.member.lastName}`.trim()
    : me.email
  return {
    id: me.id,
    email: me.email,
    name,
    role: me.roles[0] ?? 'MEMBER',
    permissions: me.permissions,
    onboardingComplete: me.onboardingCompleted,
  }
}

/* Lightweight session cookie so middleware can check auth
   without reading localStorage (which is client-only).
   Expires with the browser session by default.            */
function setSessionCookie(value: string) {
  document.cookie = `cmms_session=${value}; path=/; SameSite=Lax`
}

function clearSessionCookie() {
  document.cookie = 'cmms_session=; path=/; max-age=0'
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const tokens = await apiClient.post<never, { accessToken: string }>(
      '/auth/register',
      payload,
    )
    setAccessToken(tokens.accessToken)
    if (typeof window !== 'undefined') {
      setSessionCookie('1')
    }
    const profile = await apiClient.get<never, MeResponse>('/auth/me')
    return {
      accessToken: tokens.accessToken,
      user: mapMeToAuthUser(profile),
    }
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const tokens = await apiClient.post<never, { accessToken: string }>(
      '/auth/login',
      payload,
    )
    setAccessToken(tokens.accessToken)
    if (typeof window !== 'undefined') {
      setSessionCookie('1')
    }
    const profile = await apiClient.get<never, MeResponse>('/auth/me')
    return {
      accessToken: tokens.accessToken,
      user: mapMeToAuthUser(profile),
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post<never, void>('/auth/logout')
    if (typeof window !== 'undefined') {
      clearSessionCookie()
    }
  },

  refresh: () =>
    apiClient.post<never, { accessToken: string }>('/auth/refresh'),

  me: async (): Promise<AuthUser> => {
    const profile = await apiClient.get<never, MeResponse>('/auth/me')
    return mapMeToAuthUser(profile)
  },

  getProfile: () => apiClient.get<never, MeResponse>('/auth/me'),

  completeOnboarding: () =>
    apiClient.patch<never, void>('/auth/onboarding-complete'),

  updateLanguage: (preferredLanguage: string) =>
    apiClient.post<never, { preferredLanguage: string }>('/users/language', {
      preferredLanguage,
    }),
}
