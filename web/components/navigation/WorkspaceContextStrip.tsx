'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star, MapPin } from 'lucide-react'
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
  if (isSovereignOfficePath(pathname)) return null
  const user = useAuthStore((s) => s.user)
  const pinnedPages = useNavStore((s) => s.pinnedPages)
  const ctx = resolveWorkspaceContext(
    pathname,
    choirName,
    user?.role?.replace(/_/g, ' ') ?? null,
  )
  const crumbs = breadcrumbsFromPath(pathname)

  const parts = [
    ctx.office,
    ctx.choirName,
    ctx.roleLabel,
  ].filter(Boolean)

  if (parts.length === 0 && crumbs.length <= 1 && pinnedPages.length === 0) return null

  return (
    <div className={cn('space-y-2 mb-4', className)}>
      {(parts.length > 0 || pinnedPages.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {parts.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-800 font-medium">
              <MapPin size={12} />
              {parts.join(' · ')}
            </span>
          )}
          {pinnedPages.map((p) => (
            <Link
              key={p.path}
              href={p.path}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-50 border border-gold-200 text-gold-900 font-semibold hover:bg-gold-100 transition-colors"
            >
              <Star size={11} className="fill-gold-500 text-gold-500" />
              {p.label}
            </Link>
          ))}
        </div>
      )}
      {crumbs.length > 1 && (
        <PageBreadcrumbs items={crumbs} />
      )}
    </div>
  )
}
