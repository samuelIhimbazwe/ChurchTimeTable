import { useQuery } from '@tanstack/react-query'
import { ministriesApi } from '@/lib/api'

export function useChoirMinistry() {
  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: ministriesApi.getAll,
  })
  const choirMinistry = ministries?.find(
    (m) => m.code === 'CHOIR' || m.name.toLowerCase().includes('choir'),
  )
  return { choirMinistry, isLoading }
}
