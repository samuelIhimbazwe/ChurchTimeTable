import { apiClient } from '../client'
import type { Contribution, Paginated } from '@/types'

export interface SubmitContributionPayload {
  amount:     number
  currency?:  string
  type:       string
  month:      string
  note?:      string
  receiptUrl?: string
}

export const contributionsApi = {
  submitMine: (payload: SubmitContributionPayload) =>
    apiClient.post<never, Contribution>(
      '/finance/contributions/submit', payload),

  getMine: () =>
    apiClient.get<never, Contribution[]>(
      '/finance/contributions/mine'),

  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<never, Paginated<Contribution>>(
      '/finance/contributions', { params }),

  approve: (id: string) =>
    apiClient.patch<never, Contribution>(
      `/finance/contributions/${id}/approve`, {}),

  adjust: (id: string, data: Partial<SubmitContributionPayload>) =>
    apiClient.patch<never, Contribution>(
      `/finance/contributions/${id}/adjust`, data),

  exportPdf: () =>
    apiClient.get('/finance/contributions/export/pdf',
      { responseType: 'blob' }),
}
