import { apiClient } from '../client'
import type { Family, Contribution } from '@/types'

export const familiesApi = {
  getAll: () =>
    apiClient.get<never, Family[]>('/families'),

  getById: (id: string) =>
    apiClient.get<never, Family>(`/families/${id}`),

  getContributions: (id: string) =>
    apiClient.get<never, Contribution[]>(
      `/families/${id}/contributions`),

  approveContribution: (familyId: string, contributionId: string) =>
    apiClient.patch<never, void>(
      `/families/${familyId}/contributions/${contributionId}/approve`, {}),
}
