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

  getChoirSummary: () =>
    apiClient.get<never, Record<string, unknown>>('/choir/reports/summary'),

  exportChoirSummaryPdf: () =>
    apiClient.get('/choir/reports/summary.pdf', { responseType: 'blob' }),

  exportChoirSummaryCsv: () =>
    apiClient.get('/choir/reports/summary.csv', { responseType: 'blob' }),

  exportAttendancePdf: (params: { from: string; to: string }) =>
    apiClient.get('/reports/attendance/export/pdf', { params, responseType: 'blob' }),

  exportAttendanceCsv: (params: { from: string; to: string }) =>
    apiClient.get('/reports/attendance/export/csv', { params, responseType: 'blob' }),
}
