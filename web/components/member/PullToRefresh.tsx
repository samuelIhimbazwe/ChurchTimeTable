'use client'

import { useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  className?: string
}

export function PullToRefresh({ onRefresh, children, className }: Props) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current) return
    const dy = e.touches[0].clientY - startY.current
    if (dy > 0) setPull(Math.min(dy, 80))
  }, [])

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return
    pulling.current = false
    if (pull > 56 && !refreshing) {
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
      }
    }
    setPull(0)
  }, [pull, refreshing, onRefresh])

  return (
    <div
      className={cn('relative', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => void onTouchEnd()}
    >
      {(pull > 0 || refreshing) && (
        <div
          className="absolute left-0 right-0 flex justify-center text-xs text-text-muted z-10 pointer-events-none transition-transform"
          style={{ top: -28 + pull * 0.4 }}
        >
          {refreshing ? 'Refreshing…' : pull > 56 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
      {children}
    </div>
  )
}
