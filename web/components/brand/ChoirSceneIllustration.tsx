'use client'

import { cn } from '@/lib/utils'

type Variant = 'choir' | 'music' | 'calendar' | 'giving'

type Props = {
  variant?: Variant
  className?: string
}

export function ChoirSceneIllustration({ variant = 'choir', className }: Props) {
  if (variant === 'music') {
    return (
      <svg
        viewBox="0 0 120 80"
        className={cn('w-28 h-20 mx-auto', className)}
        aria-hidden
      >
        <ellipse cx="60" cy="68" rx="48" ry="6" fill="currentColor" className="text-primary-200/60" />
        <path d="M35 55 L35 25 Q35 15 45 15 L75 15 Q85 15 85 25 L85 55 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-700" />
        <path d="M50 55 L50 35 M60 55 L60 30 M70 55 L70 38" stroke="currentColor" strokeWidth="2" className="text-gold-600" />
      </svg>
    )
  }

  if (variant === 'calendar') {
    return (
      <svg viewBox="0 0 120 80" className={cn('w-28 h-20 mx-auto', className)} aria-hidden>
        <rect x="25" y="18" width="70" height="52" rx="6" fill="currentColor" className="text-primary-100" />
        <rect x="25" y="18" width="70" height="14" rx="6" fill="currentColor" className="text-primary-700" />
        <circle cx="42" cy="42" r="4" className="fill-gold-500" />
        <circle cx="60" cy="42" r="4" className="fill-primary-400" />
        <circle cx="78" cy="42" r="4" className="fill-primary-400" />
        <circle cx="51" cy="58" r="4" className="fill-primary-400" />
        <circle cx="69" cy="58" r="4" className="fill-success" />
      </svg>
    )
  }

  if (variant === 'giving') {
    return (
      <svg viewBox="0 0 120 80" className={cn('w-28 h-20 mx-auto', className)} aria-hidden>
        <path d="M60 20 C45 20 35 32 35 45 C35 58 60 68 60 68 C60 68 85 58 85 45 C85 32 75 20 60 20 Z" fill="currentColor" className="text-gold-100" stroke="currentColor" strokeWidth="2" />
        <path d="M60 28 L60 58 M48 40 L72 40" stroke="currentColor" strokeWidth="2.5" className="text-gold-600" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 120 80" className={cn('w-32 h-20 mx-auto', className)} aria-hidden>
      <ellipse cx="60" cy="70" rx="50" ry="5" fill="currentColor" className="text-primary-200/50" />
      <path
        d="M30 55 Q60 20 90 55 L85 58 Q60 35 35 58 Z"
        fill="currentColor"
        className="text-primary-700"
      />
      <circle cx="45" cy="48" r="5" fill="currentColor" className="text-gold-400" />
      <circle cx="60" cy="42" r="5" fill="currentColor" className="text-gold-400" />
      <circle cx="75" cy="48" r="5" fill="currentColor" className="text-gold-400" />
      <path d="M55 58 Q60 52 65 58" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-gold-300" />
    </svg>
  )
}
