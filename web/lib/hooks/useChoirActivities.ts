import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { choirActivityApi, SubmitChoirAttendancePayload } from '../api/modules/choirActivity'

export function useChoirActivities(params?: Parameters<typeof choirActivityApi.getAll>[0]) {
  return useQuery({
    queryKey:  ['choir-activities', params],
    queryFn:   () => choirActivityApi.getAll(params),
    staleTime: 2 * 60 * 1000,
  })
}

export function useSubmitChoirAttendance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SubmitChoirAttendancePayload) =>
      choirActivityApi.submitAttendance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['choir-activities'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
