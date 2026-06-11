import { useQuery } from '@tanstack/react-query'
import { memberPortalApi } from '@/lib/api/modules/memberPortal'

export function useChoirSponsorDashboardContext(
  choirId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['choir-sponsor-dashboard-context', choirId],
    queryFn: () => memberPortalApi.getChoirSponsorDashboardContext(choirId!),
    enabled: !!choirId && (options?.enabled ?? true),
    retry: false,
  })
}
