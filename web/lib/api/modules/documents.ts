import { apiClient } from '../client'

export interface DocumentItem {
  id:          string
  title:       string
  category?:   string
  description?: string
  fileName?:   string
  fileUrl?:    string
  mimeType?:   string
  createdAt:   string
  updatedAt?:  string
}

function normalizeDocs(raw: unknown): DocumentItem[] {
  if (Array.isArray(raw)) return raw as DocumentItem[]
  if (raw && typeof raw === 'object' && 'items' in raw) {
    return (raw as { items: DocumentItem[] }).items
  }
  return []
}

export const documentsApi = {
  getChoirDocuments: async (): Promise<DocumentItem[]> => {
    const raw = await apiClient.get<never, unknown>('/choir/documents')
    return normalizeDocs(raw)
  },

  getChoirDocument: (id: string) =>
    apiClient.get<never, DocumentItem>(`/choir/documents/${id}`),

  createChoirDocument: (data: {
    title: string
    category?: string
    description?: string
    fileName: string
    fileUrl: string
    mimeType?: string
  }) => apiClient.post<never, DocumentItem>('/choir/documents', data),

  getMinistryDocuments: async (ministryId: string): Promise<DocumentItem[]> => {
    const raw = await apiClient.get<never, unknown>(
      `/ministries/${ministryId}/documents`)
    return normalizeDocs(raw)
  },
}
