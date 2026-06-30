'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Card from '@/components/shared/Card'

type Props = {
  href: string
  children: React.ReactNode
  accent?: 'gold' | 'success' | 'warning' | 'danger' | 'info'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  showChevron?: boolean
}

/** Full-width card that navigates to a detail or section page. */
export function OfficeNavCard({
  href,
  children,
  accent,
  padding = 'md',
  className,
  showChevron = true,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        'block group rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        className,
      )}
    >
      <Card
        padding={padding}
        accent={accent}
        className="transition-all duration-fast group-hover:shadow-raised group-hover:-translate-y-0.5 h-full cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">{children}</div>
          {showChevron && (
            <ChevronRight
              size={18}
              className="text-text-muted shrink-0 mt-0.5 group-hover:text-primary-600 transition-colors"
            />
          )}
        </div>
      </Card>
    </Link>
  )
}
