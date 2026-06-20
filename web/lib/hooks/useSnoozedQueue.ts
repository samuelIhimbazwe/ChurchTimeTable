'use client'

import { useCallback, useMemo, useState } from 'react'
import { isSnoozed } from '@/lib/workflow/snooze'

/**
 * Filters queue items hidden by local snooze, with a tick to re-render after snooze changes.
 */
export function useSnoozedQueue<T>(
  items: T[],
  getEntityKey: (item: T) => string,
) {
  const [tick, setTick] = useState(0)

  const visibleItems = useMemo(() => {
    void tick
    return items.filter((item) => !isSnoozed(getEntityKey(item)))
  }, [items, getEntityKey, tick])

  const bumpSnooze = useCallback(() => setTick((t) => t + 1), [])

  return { visibleItems, bumpSnooze }
}
