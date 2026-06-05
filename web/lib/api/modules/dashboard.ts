import { apiClient } from '../client'
import type {
  MemberDashboardSummary,
  LeaderDashboardSummary,
  AdminDashboardSummary,
} from '@/types'

export const dashboardApi = {
  getMemberSummary: () =>
    apiClient.get<never, MemberDashboardSummary>(
      '/dashboard/member-summary'),

  getLeaderSummary: () =>
    apiClient.get<never, LeaderDashboardSummary>(
      '/dashboard/leader'),

  getAdminSummary: () =>
    apiClient.get<never, AdminDashboardSummary>(
      '/dashboard/admin-summary'),

  getOperationalChoir: () =>
    apiClient.get<never, LeaderDashboardSummary>(
      '/dashboard/operational/choir-leader'),
}
