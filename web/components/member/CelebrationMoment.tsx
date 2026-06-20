'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/shared'
import { Sparkles, X } from 'lucide-react'
import { ConfettiBurst } from '@/components/member/ConfettiBurst'
import { cn } from '@/lib/utils'

type Props = {
  show: boolean
  title: string
  message: string
  onDismiss: () => void
  accent?: 'gold' | 'success' | 'info'
  withConfetti?: boolean
  className?: string
}

export function CelebrationMoment({
  show,
  title,
  message,
  onDismiss,
  accent = 'gold',
  withConfetti = true,
  className,
}: Props) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    setVisible(show)
  }, [show])

  if (!visible) return null

  return (
    <>
      {withConfetti && <ConfettiBurst active />}
      <Card accent={accent} padding="md" className={cn('relative animate-page-enter', className)}>
        <button
          type="button"
          onClick={() => {
            setVisible(false)
            onDismiss()
          }}
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary touch-target"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <Sparkles size={22} className="text-gold-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-lg text-text-primary">{title}</p>
            <p className="text-sm text-text-secondary mt-1">{message}</p>
          </div>
        </div>
      </Card>
    </>
  )
}
