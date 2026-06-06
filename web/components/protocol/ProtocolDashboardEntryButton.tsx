'use client'

import Link from 'next/link'
import { protocolMemberHome } from '@/lib/protocol/paths'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'
import { Shield, ChevronRight } from 'lucide-react'

type Props = {
  className?: string
  label?: string
  variant?: 'primary' | 'link'
}

/** Opens the composed protocol dashboard — landing matches the member's committee roles. */
export function ProtocolDashboardEntryButton({
  className = '',
  label = 'Open protocol dashboard',
  variant = 'primary',
}: Props) {
  const { data: context, isLoading } = useProtocolDashboardContext()
  const href = context?.landingPath ?? protocolMemberHome()

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
      <Shield size={16} /> {isLoading ? 'Opening…' : label}
    </Link>
  )
}
