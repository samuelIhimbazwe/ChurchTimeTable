'use client'

import Link from 'next/link'
import { choirMemberHome } from '@/lib/choir/paths'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { Music, ChevronRight } from 'lucide-react'

type Props = {
  choirId: string
  className?: string
  label?: string
  variant?: 'primary' | 'link'
}

/** Opens this choir's composed dashboard — landing matches the member's role in that choir. */
export function ChoirDashboardEntryButton({
  choirId,
  className = '',
  label = 'My membership',
  variant = 'primary',
}: Props) {
  const { data: context, isLoading } = useChoirDashboardContext(choirId)
  const href = context?.landingPath ?? choirMemberHome(choirId)

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
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-60 ${className}`}
      aria-busy={isLoading}
    >
      <Music size={16} /> {isLoading ? 'Opening…' : label}
    </Link>
  )
}
