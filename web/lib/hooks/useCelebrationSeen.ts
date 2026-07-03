'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export function useCelebrationSeen(storageKey: string) {
  const [seen, setSeen] = useState(true)

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(storageKey) === '1')
    } catch {
      setSeen(false)
    }
  }, [storageKey])

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }
    setSeen(true)
  }, [storageKey])

  return { seen, markSeen, shouldCelebrate: !seen }
}

export function useCelebrationSet(storageKey: string) {
  const readSet = useCallback((): Set<string> => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return new Set()
      return new Set(JSON.parse(raw) as string[])
    } catch {
      return new Set()
    }
  }, [storageKey])

  const markItems = useCallback(
    (ids: string[]) => {
      try {
        const next = new Set([...Array.from(readSet()), ...ids])
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)))
      } catch {
        /* ignore */
      }
    },
    [readSet, storageKey],
  )

  const findNew = useCallback(
    (ids: string[]) => {
      const prev = readSet()
      return ids.filter((id) => !prev.has(id))
    },
    [readSet],
  )

  return useMemo(() => ({ findNew, markItems }), [findNew, markItems])
}
