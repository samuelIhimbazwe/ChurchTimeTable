import { apiClient } from '../client'
import type { ChoirPositionRole } from './choir'

export type ChoirSodWarning = {
  id: string
  severity: 'high' | 'medium' | 'low'
  message: string
  permissions?: string[]
  roleNames?: string[]
}

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
    apiClient.post<
      never,
      { role: ChoirPositionRole; sodWarnings: ChoirSodWarning[] }
    >('/governance/choir/roles', data),

  checkChoirSod: (permissions: string[], roleName?: string) =>
    apiClient.post<never, { warnings: ChoirSodWarning[] }>(
      '/governance/choir/sod-check',
      { permissions, roleName },
    ),

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
