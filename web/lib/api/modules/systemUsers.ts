import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface SystemRoleOption {
  id: string
  name: string
  description: string | null
}

export interface SystemUserMember {
  id: string
  memberNumber: string | null
  firstName: string
  lastName: string
  phone: string | null
  ministry: string
  status: string
}

export interface SystemUser {
  id: string
  email: string
  isActive: boolean
  preferredLanguage: string
  createdAt: string
  updatedAt: string
  member: SystemUserMember | null
  roles: SystemRoleOption[]
}

export interface CreateSystemUserPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  ministry?: 'CHOIR' | 'PROTOCOL' | 'BOTH'
  roleNames: string[]
  preferredLanguage?: string
}

function mapPaginatedUsers(raw: {
  items?: SystemUser[]
  meta?: { total: number; page: number; limit: number; totalPages: number }
}): Paginated<SystemUser> {
  const meta = raw.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }
  return {
    items: raw.items ?? [],
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
  }
}

export const systemUsersApi = {
  list: async (params?: {
    q?: string
    page?: number
    limit?: number
    activeOnly?: boolean
  }): Promise<Paginated<SystemUser>> => {
    const raw = await apiClient.get<
      never,
      { items?: SystemUser[]; meta?: Paginated<SystemUser> }
    >('/system/users', { params })
    return mapPaginatedUsers(raw)
  },

  listRoles: () =>
    apiClient.get<never, SystemRoleOption[]>('/system/users/roles'),

  create: (payload: CreateSystemUserPayload) =>
    apiClient.post<never, SystemUser>('/system/users', payload),

  update: (id: string, payload: { isActive?: boolean; preferredLanguage?: string }) =>
    apiClient.patch<never, SystemUser>(`/system/users/${id}`, payload),

  assignRoles: (
    id: string,
    payload: { roleNames: string[]; mode?: 'replace' | 'add' },
  ) => apiClient.patch<never, SystemUser>(`/system/users/${id}/roles`, payload),

  resetPassword: (id: string, password: string) =>
    apiClient.post<never, { ok: boolean }>(`/system/users/${id}/reset-password`, {
      password,
    }),
}
