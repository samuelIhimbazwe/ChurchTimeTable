'use client'

import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SwipeAction = {
  id: string
  label: string
  className: string
  onTrigger: () => void
}

type Props = {
  children: ReactNode
  leftAction?: SwipeAction
  rightAction?: SwipeAction
  className?: string
}

const THRESHOLD = 72

export function SwipeableRow({
  children,
  leftAction,
  rightAction,
  className,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    setDragging(true)
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const delta = e.touches[0].clientX - startX.current
    const max = rightAction ? THRESHOLD * 1.4 : 0
    const min = leftAction ? -THRESHOLD * 1.4 : 0
    setOffset(Math.max(min, Math.min(max, delta)))
  }

  function onTouchEnd() {
    setDragging(false)
    if (offset >= THRESHOLD && rightAction) {
      rightAction.onTrigger()
    } else if (offset <= -THRESHOLD && leftAction) {
      leftAction.onTrigger()
    }
    setOffset(0)
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 flex">
        {leftAction && (
          <div
            className={cn(
              'flex items-center justify-start pl-4 w-1/2',
              leftAction.className,
            )}
          >
            <span className="text-xs font-bold uppercase">{leftAction.label}</span>
          </div>
        )}
        {rightAction && (
          <div
            className={cn(
              'flex items-center justify-end pr-4 w-1/2 ml-auto',
              rightAction.className,
            )}
          >
            <span className="text-xs font-bold uppercase">{rightAction.label}</span>
          </div>
        )}
      </div>
      <div
        className={cn(
          'relative bg-surface transition-transform',
          dragging ? 'duration-0' : 'duration-200',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
