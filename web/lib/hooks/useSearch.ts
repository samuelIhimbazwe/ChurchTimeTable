import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api'

export function useSearch() {
  const [query, setQuery] = useState('')

  const results = useQuery({
    queryKey: ['search', query],
    queryFn:  () => searchApi.query(query),
    enabled:  query.trim().length >= 2,
    staleTime: 30 * 1000,
  })

  const clear = useCallback(() => setQuery(''), [])

  return { query, setQuery, clear, ...results }
}
