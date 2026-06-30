'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

/** Full-width list row that navigates on click (portal feeds, audit logs, etc.). */
export function InteractiveListLink({ href, children, className, onClick }: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'interactive-link block w-full text-left',
        className,
      )}
    >
      {children}
    </Link>
  )
}
