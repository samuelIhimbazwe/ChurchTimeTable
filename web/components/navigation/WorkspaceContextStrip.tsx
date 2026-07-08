'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star } from 'lucide-react'
import { useAuthStore } from '@/stores/index'
import { useNavStore } from '@/lib/navigation/nav-store'
import { resolveWorkspaceContext } from '@/lib/navigation/workspace-context'
import { isSovereignOfficePath } from '@/lib/choir/office-themes'
import { PageBreadcrumbs } from '@/components/shared/PageBreadcrumbs'
import { breadcrumbsFromPath } from '@/lib/navigation/route-breadcrumbs'
import { cn } from '@/lib/utils'

type Props = {
  choirName?: string | null
  className?: string
}

export function WorkspaceContextStrip({ choirName, className }: Props) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const pinnedPages = useNavStore((s) => s.pinnedPages)

  if (isSovereignOfficePath(pathname)) return null
  const ctx = resolveWorkspaceContext(
    pathname,
    choirName,
    user?.role?.replace(/_/g, ' ') ?? null,
  )
  const crumbs = breadcrumbsFromPath(pathname)

  const contextLabel = [
    ctx.office,
    ctx.choirName,
    ctx.roleLabel,
  ].filter(Boolean).join(' · ')

  if (!contextLabel && crumbs.length <= 1 && pinnedPages.length === 0) return null

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[1.25rem]">
        {contextLabel && (
          <p className="text-[11px] text-text-muted tracking-wide truncate">
            {contextLabel}
          </p>
        )}
        {pinnedPages.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {pinnedPages.map((p) => (
              <Link
                key={p.path}
                href={p.path}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-text-secondary border border-border hover:bg-surface-raised hover:text-text-primary transition-colors"
              >
                <Star size={10} className="text-gold-500 fill-gold-500 shrink-0" />
                {p.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      {crumbs.length > 1 && (
        <PageBreadcrumbs items={crumbs} />
      )}
    </div>
  )
}
