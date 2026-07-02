import { apiClient } from '../client'
import type { Paginated } from '@/types'

export type AccountInviteType = 'CHOIR' | 'PROTOCOL' | 'DUAL'
export type AccountInviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'

export interface AccountInvite {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  inviteType: AccountInviteType
  status: AccountInviteStatus
  expiresAt: string
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  choir: { id: string; name: string; code: string } | null
  invitedBy?: { id: string; email: string; name: string }
  inviteUrl?: string
  whatsappMessage?: string
}

export interface CreateAccountInvitePayload {
  email: string
  firstName: string
  lastName: string
  phone?: string
  inviteType: AccountInviteType
  choirId?: string
}

function mapPaginatedInvites(raw: {
  items?: AccountInvite[]
  meta?: { total: number; page: number; limit: number; totalPages: number }
}): Paginated<AccountInvite> {
  const meta = raw.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }
  return {
    items: raw.items ?? [],
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
  }
}

export const invitesApi = {
  list: async (params?: {
    page?: number
    limit?: number
    status?: AccountInviteStatus
    inviteType?: AccountInviteType
  }): Promise<Paginated<AccountInvite>> => {
    const raw = await apiClient.get<
      never,
      { items?: AccountInvite[]; meta?: Paginated<AccountInvite> }
    >('/invites', { params })
    return mapPaginatedInvites(raw)
  },

  create: (payload: CreateAccountInvitePayload) =>
    apiClient.post<never, AccountInvite>('/invites', payload),

  revoke: (id: string) =>
    apiClient.patch<never, AccountInvite>(`/invites/${id}/revoke`),

  resend: (id: string) =>
    apiClient.post<never, AccountInvite>(`/invites/${id}/resend`),
}
