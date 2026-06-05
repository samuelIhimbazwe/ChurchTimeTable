import { useQuery } from '@tanstack/react-query'
import { membersApi, MembersParams } from '../api/modules/members'

export function useMembers(params?: MembersParams) {
  return useQuery({
    queryKey:  ['members', params],
    queryFn:   () => membersApi.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  })
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn:  () => membersApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled:  !!id,
  })
}
