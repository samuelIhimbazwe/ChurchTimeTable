'use client'

import Link from 'next/link'
import { useChoirSponsorDashboardContext } from '@/lib/hooks/useChoirSponsorDashboardContext'
import { Heart, ChevronRight } from 'lucide-react'

type Props = {
  choirId: string
  className?: string
  label?: string
  variant?: 'primary' | 'link'
}

export function ChoirSponsorEntryButton({
  choirId,
  className = '',
  label = 'Sponsor dashboard',
  variant = 'primary',
}: Props) {
  const { data: context, isLoading } = useChoirSponsorDashboardContext(choirId)
  const href = context?.landingPath ?? `/choir/${choirId}/sponsor`

  if (variant === 'link') {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-800 ${className}`}
      >
        {isLoading ? 'Loading…' : label} <ChevronRight size={14} />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-60 ${className}`}
      aria-busy={isLoading}
    >
      <Heart size={16} /> {isLoading ? 'Opening…' : label}
    </Link>
  )
}
