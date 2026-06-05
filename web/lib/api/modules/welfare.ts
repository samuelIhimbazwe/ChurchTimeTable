import { apiClient } from '../client'
import type { WelfareCase } from '@/types'

export const welfareApi = {
  getAll: (params?: { status?: string }) =>
    apiClient.get<never, WelfareCase[]>('/choir/welfare', { params }),

  getById: (id: string) =>
    apiClient.get<never, WelfareCase>(`/choir/welfare/${id}`),

  create: (data: { memberId: string; type: string; description: string }) =>
    apiClient.post<never, WelfareCase>('/choir/welfare', data),

  update: (id: string, data: Partial<WelfareCase>) =>
    apiClient.patch<never, WelfareCase>(`/choir/welfare/${id}`, data),
}
