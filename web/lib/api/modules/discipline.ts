import { apiClient } from '../client'
import type { DisciplineCase, DisciplineStage } from '@/types'

export const disciplineApi = {
  getAll: () =>
    apiClient.get<never, DisciplineCase[]>('/discipline'),

  getById: (id: string) =>
    apiClient.get<never, DisciplineCase>(`/discipline/${id}`),

  advance: (id: string, stage: DisciplineStage, note: string) =>
    apiClient.patch<never, DisciplineCase>(
      `/discipline/${id}/advance`, { stage, note }),
}
