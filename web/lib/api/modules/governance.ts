import { apiClient } from '../client'
import type { ChoirPositionRole } from './choir'

export const governanceApi = {
  getChoirScope: (scopeId: string) =>
    apiClient.get<
      never,
      { roles: ChoirPositionRole[]; members: unknown[] }
    >(`/governance/choir/${scopeId}`),

  getProtocolScope: (scopeId: string) =>
    apiClient.get<never, Record<string, unknown>>(`/governance/protocol/${scopeId}`),

  upsertChoirRole: (data: {
    scopeId: string
    name: string
    permissions: string[]
    description?: string
  }) =>
    apiClient.post<never, ChoirPositionRole>('/governance/choir/roles', data),

  assignChoirMember: (data: {
    scopeId: string
    memberId: string
    roleId: string
  }) =>
    apiClient.post<never, unknown>('/governance/choir/members', data),

  assignProtocolMember: (data: {
    scopeId: string
    memberId: string
    roleId: string
  }) =>
    apiClient.post<never, unknown>('/governance/protocol/members', data),

  revokeProtocolMember: (assignmentId: string) =>
    apiClient.delete<never, { revoked: boolean }>(`/governance/protocol/members/${assignmentId}`),

  upsertProtocolRole: (data: {
    scopeId: string
    name: string
    permissions: string[]
  }) =>
    apiClient.post<never, unknown>('/governance/protocol/roles', data),

  getPermissionAudit: () =>
    apiClient.get<never, unknown[]>('/pilot/permission-audit'),
}
