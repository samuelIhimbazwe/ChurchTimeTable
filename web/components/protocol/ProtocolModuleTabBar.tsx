'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useProtocolDashboardCtx } from '@/components/protocol/ProtocolDashboardProvider'
import {
  getProtocolModuleTabs,
  isProtocolModuleTabActive,
  type ProtocolModuleTab,
} from '@/lib/navigation/protocol-module-nav'
import { usePlatformCapabilityRouter } from '@/lib/hooks/usePlatformCapability'

function filterTabsByCapability(
  tabs: ProtocolModuleTab[],
  can: (id: string) => boolean,
): ProtocolModuleTab[] {
  return tabs.filter((tab) => !tab.capability || can(tab.capability))
}

export function ProtocolModuleTabBar() {
  const pathname = usePathname()
  const { context } = useProtocolDashboardCtx()
  const permissions = context?.permissions ?? []
  const can = usePlatformCapabilityRouter()

  const moduleNav = useMemo(
    () => getProtocolModuleTabs(pathname, permissions),
    [pathname, permissions],
  )

  if (!moduleNav?.tabs.length) return null

  const tabs = filterTabsByCapability(moduleNav.tabs, can)

  if (tabs.length < 2) return null

  return (
    <div className="sticky top-[calc(4rem+env(safe-area-inset-top,0px))] z-20 -mx-3 sm:-mx-4 md:-mx-6 bg-surface border-b border-border shadow-sm">
      <nav
        className="scroll-strip px-3 sm:px-4 md:px-6 py-2 flex gap-1.5"
        aria-label="Protocol module sections"
      >
        {tabs.map((tab) => {
          const active = isProtocolModuleTabActive(pathname, tab.href)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 px-3.5 py-2 min-h-[2.75rem] text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-colors',
                active
                  ? 'bg-primary-700 text-white shadow-sm'
                  : 'text-text-muted hover:bg-surface-raised hover:text-text-primary',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
