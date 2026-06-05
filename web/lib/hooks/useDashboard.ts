import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api'
import { useAuthStore } from '@/stores'
import type {
  MemberDashboardSummary,
  LeaderDashboardSummary,
  AdminDashboardSummary,
} from '@/types'

type DashboardData =
  | MemberDashboardSummary
  | LeaderDashboardSummary
  | AdminDashboardSummary

export function useDashboard() {
  const role = useAuthStore((s) => s.user?.role)

  const queryFn =
    role === 'MEMBER'             ? dashboardApi.getMemberSummary  :
    role === 'SUPER_ADMIN' ||
    role === 'CHURCH_ADMIN'       ? dashboardApi.getAdminSummary   :
                                    dashboardApi.getLeaderSummary

  return useQuery<DashboardData>({
    queryKey:  ['dashboard', role],
    queryFn:   () => queryFn(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
