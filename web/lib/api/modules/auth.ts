import { apiClient, setAccessToken } from '../client'
import type { ResolvedAuth } from '@/lib/choir/capability.types'
import { usePlatformAuthStore } from '@/stores/platform-auth'

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
  mustChangePassword?: boolean
  homePath?: string
  accessRouting?: AccessRouting
}

export interface AccessRouting {
  homePath: string
  ministryScope: string | null
  isDualMember: boolean
  hasChoirMembership: boolean
  hasProtocolMembership: boolean
  primaryChoirId: string | null
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
  mustChangePassword?: boolean
  preferredLanguage?: string
  member?: {
    id: string
    firstName: string
    lastName: string
  } | null
  protocolAuth?: ResolvedAuth
  churchAuth?: ResolvedAuth
  platformAuth?: ResolvedAuth
  accessRouting?: AccessRouting
}

function syncPlatformAuthsFromMe(me: MeResponse) {
  usePlatformAuthStore.getState().setPlatformAuths({
    protocolAuth: me.protocolAuth,
    churchAuth: me.churchAuth,
    platformAuth: me.platformAuth,
  })
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
    mustChangePassword: me.mustChangePassword,
    homePath: me.accessRouting?.homePath,
    accessRouting: me.accessRouting,
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
    syncPlatformAuthsFromMe(profile)
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
    syncPlatformAuthsFromMe(profile)
    return {
      accessToken: tokens.accessToken,
      user: mapMeToAuthUser(profile),
    }
  },

  logout: async (): Promise<void> => {
    await apiClient.post<never, void>('/auth/logout')
    usePlatformAuthStore.getState().clearPlatformAuths()
    if (typeof window !== 'undefined') {
      clearSessionCookie()
    }
  },

  refresh: () =>
    apiClient.post<never, { accessToken: string }>('/auth/refresh'),

  me: async (): Promise<AuthUser> => {
    const profile = await apiClient.get<never, MeResponse>('/auth/me')
    syncPlatformAuthsFromMe(profile)
    return mapMeToAuthUser(profile)
  },

  getProfile: async () => {
    const profile = await apiClient.get<never, MeResponse>('/auth/me')
    syncPlatformAuthsFromMe(profile)
    return profile
  },

  completeOnboarding: () =>
    apiClient.patch<never, void>('/auth/onboarding-complete'),

  forgotPassword: (email: string) =>
    apiClient.post<
      never,
      { ok: boolean; message: string; devResetUrl?: string }
    >('/auth/forgot-password', { email }),

  resetPassword: (payload: { token: string; password: string }) =>
    apiClient.post<never, { ok: boolean }>('/auth/reset-password', payload),

  previewInvite: (token: string) =>
    apiClient.get<
      never,
      {
        valid: boolean
        email: string
        firstName: string
        lastName: string
        inviteType: string
        choir?: { id: string; name: string; code: string } | null
        assignedRole?: { id: string; name: string } | null
        assignedProtocolRole?: { id: string; name: string } | null
        expiresAt: string
      }
    >('/auth/invite', { params: { token } }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<never, { ok: boolean }>('/auth/change-password', payload),

  acceptInvite: async (payload: {
    token: string
    password: string
    acceptedTerms: boolean
  }): Promise<LoginResponse> => {
    const tokens = await apiClient.post<never, { accessToken: string }>(
      '/auth/accept-invite',
      payload,
    )
    setAccessToken(tokens.accessToken)
    if (typeof window !== 'undefined') {
      setSessionCookie('1')
    }
    const profile = await apiClient.get<never, MeResponse>('/auth/me')
    syncPlatformAuthsFromMe(profile)
    return {
      accessToken: tokens.accessToken,
      user: mapMeToAuthUser(profile),
    }
  },

  updateLanguage: (preferredLanguage: string) =>
    apiClient.post<never, { preferredLanguage: string }>('/users/language', {
      preferredLanguage,
    }),
}
