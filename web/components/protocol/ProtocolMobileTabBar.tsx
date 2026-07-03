'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'
import {
  getProtocolPrimaryNav,
  protocolLandingPath,
  detectProtocolModule,
} from '@/lib/navigation/protocol-module-nav'

/** Mobile bottom bar — primary protocol modules only (≤5). */
export function ProtocolMobileTabBar() {
  const pathname = usePathname()
  const { context } = useProtocolDashboardCtx()
  const permissions = context?.permissions ?? []
  const landing = protocolLandingPath(context?.positions ?? [])

  const items = useMemo(() => {
    const nav = getProtocolPrimaryNav(permissions, landing)
    return nav.slice(0, 5)
  }, [permissions, landing])

  if (items.length < 2) return null

  const activeModule = detectProtocolModule(pathname)

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md safe-bottom"
        aria-label="Protocol modules"
      >
        <div className="flex items-stretch justify-around px-1 pt-1">
          {items.map((item) => {
            const Icon = item.icon ?? Home
            const active =
              activeModule != null && 'moduleId' in item && item.moduleId === activeModule
                ? true
                : (item.path === landing && (activeModule === 'home' || pathname === landing)) ||
                  (item.path !== landing && pathname.startsWith(item.path))

            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] touch-target text-[10px] font-semibold',
                  active ? 'text-primary-700' : 'text-text-muted',
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                <span className="truncate max-w-[4.5rem]">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <div className="lg:hidden h-[calc(4.5rem+env(safe-area-inset-bottom,0px))]" aria-hidden />
    </>
  )
}
