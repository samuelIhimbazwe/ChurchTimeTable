import { apiClient } from '../client'
import type { Paginated } from '@/types'

export interface Asset {
  id:          string
  name:        string
  category?:   string
  status?:     string
  condition?:  string
  location?:   string
  assignedTo?: string
}

function normalizeAssets(raw: unknown): Asset[] {
  if (Array.isArray(raw)) return raw as Asset[]
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return (raw as Paginated<Asset>).items
  }
  return []
}

export const assetsApi = {
  getAll: async (params?: { page?: number; limit?: number; category?: string }) => {
    const raw = await apiClient.get<never, unknown>('/assets', { params })
    if (raw && typeof raw === 'object' && 'items' in raw) {
      return raw as Paginated<Asset>
    }
    const items = normalizeAssets(raw)
    return { items, total: items.length, page: 1, limit: 50, totalPages: 1 } as Paginated<Asset>
  },

  getById: (id: string) =>
    apiClient.get<never, Asset>(`/assets/${id}`),

  getDashboard: () =>
    apiClient.get<never, Record<string, unknown>>('/assets/dashboard'),

  getCategories: () =>
    apiClient.get<never, unknown[]>('/assets/categories'),

  getChoirUniforms: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/uniforms/dashboard'),

  getChoirEquipment: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/equipment/dashboard'),

  create: (data: {
    code: string
    name: string
    categoryId: string
    description?: string
    status?: string
    condition?: string
    serialNumber?: string
    notes?: string
  }) => apiClient.post<never, Asset>('/assets', data),

  update: (id: string, data: Partial<{
    name: string
    description: string
    status: string
    condition: string
    location: string
    notes: string
  }>) => apiClient.patch<never, Asset>(`/assets/${id}`, data),

  assign: (id: string, data: {
    assignedToType: string
    assignedToId: string
    purpose?: string
    expectedReturnAt?: string
    notes?: string
  }) => apiClient.post<never, unknown>(`/assets/${id}/assignments`, data),
}
