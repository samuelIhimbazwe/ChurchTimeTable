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
    effectiveStart?: string
  }) =>
    apiClient.post<never, unknown>('/governance/choir/members', data),

  revokeChoirMember: (assignmentId: string, effectiveEnd?: string) =>
    apiClient.delete<never, { revoked: boolean }>(
      `/governance/choir/members/${assignmentId}`,
      { data: effectiveEnd ? { effectiveEnd } : undefined },
    ),

  listChoirRoleTemplates: () =>
    apiClient.get<
      never,
      {
        templates: Array<{
          id: string
          name: string
          label: string
          description: string | null
          permissions: string[]
          permissionCount: number
        }>
      }
    >('/governance/choir/role-templates'),

  applyChoirRoleTemplate: (
    templateId: string,
    data: { scopeId: string; roleName?: string },
  ) =>
    apiClient.post<
      never,
      { role: ChoirPositionRole; sodWarnings: ChoirSodWarning[] }
    >(`/governance/choir/role-templates/${templateId}/apply`, data),

  listAdvisorElevations: (choirId: string, activeOnly = true) =>
    apiClient.get<
      never,
      {
        items: Array<{
          id: string
          memberId: string
          memberName: string | null
          memberNumber: string | null
          permissions: string[]
          reason: string | null
          startsAt: string
          endsAt: string
          revokedAt: string | null
          isActive: boolean
        }>
      }
    >(`/governance/choir/${choirId}/advisor-elevations`, {
      params: { activeOnly: activeOnly ? 'true' : 'false' },
    }),

  createAdvisorElevation: (data: {
    scopeId: string
    memberId: string
    permissions: string[]
    durationDays?: number
    reason?: string
  }) =>
    apiClient.post<never, { elevation: unknown; sodWarnings: ChoirSodWarning[] }>(
      '/governance/choir/advisor-elevations',
      data,
    ),

  revokeAdvisorElevation: (elevationId: string) =>
    apiClient.delete<never, { revoked: boolean }>(
      `/governance/choir/advisor-elevations/${elevationId}`,
    ),

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
