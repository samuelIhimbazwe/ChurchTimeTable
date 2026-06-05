import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '../api'

export function useNotifications() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey:          ['notifications'],
    queryFn:           notificationsApi.getAll,
    staleTime:         30 * 1000,
    refetchInterval:   60 * 1000,
  })

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return { ...query, markRead, markAllRead }
}
