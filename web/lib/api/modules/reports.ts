import { apiClient } from '../client'

export const reportsApi = {
  getAttendance: (params?: { from?: string; to?: string; ministry?: string }) =>
    apiClient.get<never, Record<string, unknown>>('/reports/attendance', { params }),

  getDiscipline: (params?: { ministry?: string }) =>
    apiClient.get<never, Record<string, unknown>>('/reports/discipline', { params }),

  getFinance: () =>
    apiClient.get<never, Record<string, unknown>>('/reports/finance'),

  getProtocolQuota: (params?: { month?: string }) =>
    apiClient.get<never, Record<string, unknown>>('/reports/protocol-quota', { params }),

  getScoreTrends: (params?: { months?: number }) =>
    apiClient.get<never, unknown[]>('/reports/scores/trends', { params }),

  getChoirSummary: (choirId?: string) =>
    apiClient.get<never, Record<string, unknown>>('/choir/reports/summary', {
      params: choirId ? { choirId } : undefined,
    }),

  getChoirHealth: (choirId: string) =>
    apiClient.get<
      never,
      {
        choirId: string | null
        score: number
        grade: string
        participation: {
          memberCount: number
          averageParticipation: number
          membersAtRisk: number
          serviceRateAvg: number
        } | null
        welfareActiveCases: number | null
        officerAttentionCount: number | null
        generatedAt: string
      }
    >('/choir/reports/health', { params: { choirId } }),

  exportChoirSummaryPdf: (choirId?: string) =>
    apiClient.get('/choir/reports/summary.pdf', {
      params: choirId ? { choirId } : undefined,
      responseType: 'blob',
    }),

  exportChoirSummaryCsv: (choirId?: string) =>
    apiClient.get('/choir/reports/summary.csv', {
      params: choirId ? { choirId } : undefined,
      responseType: 'blob',
    }),

  exportChoirHealthPackPdf: (choirId: string) =>
    apiClient.get('/choir/reports/health-pack.pdf', {
      params: { choirId },
      responseType: 'blob',
    }),

  exportAttendancePdf: (params: { from: string; to: string }) =>
    apiClient.get('/reports/attendance/export/pdf', { params, responseType: 'blob' }),

  exportAttendanceCsv: (params: { from: string; to: string }) =>
    apiClient.get('/reports/attendance/export/csv', { params, responseType: 'blob' }),
}
