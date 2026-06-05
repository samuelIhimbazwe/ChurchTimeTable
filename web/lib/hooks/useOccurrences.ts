import { useQuery } from '@tanstack/react-query'
import { occurrencesApi, OccurrencesParams } from '../api/modules/occurrences'

export function useOccurrences(params?: OccurrencesParams) {
  return useQuery({
    queryKey:  ['occurrences', params],
    queryFn:   () => occurrencesApi.getAll(params),
    staleTime: 2 * 60 * 1000,
  })
}
