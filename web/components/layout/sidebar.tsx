'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore } from '@/stores/index'
import { getNavForContext, getPortalNavForUser } from '@/lib/navigation/role-nav'
import { getComposedChoirNav } from '@/lib/navigation/choir-nav'
import { getComposedProtocolNav } from '@/lib/navigation/protocol-nav'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { isProtocolDashboardPath } from '@/lib/protocol/paths'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'

const EMPTY_PERMISSIONS: string[] = []

export default function Sidebar({ role = 'MEMBER' }: { role?: string }) {
  const pathname  = usePathname()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle    = useUIStore((s) => s.toggleSidebar)
  const authRole  = useAuthStore((s) => s.user?.role) ?? role
  const permissions = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS)
  const { canAccessChoirArea, isChoirMember, isLoading: loadingChoirAccess, activeChoirMemberships } = useChoirAccess()
  const choirId = parseChoirIdFromPath(pathname)
  const inProtocolArea = isProtocolDashboardPath(pathname)
  const { data: choirCtx, isLoading: loadingChoirCtx } = useChoirDashboardContext(choirId)
  const { data: protocolCtx, isLoading: loadingProtocolCtx } = useProtocolDashboardContext(inProtocolArea)

  const sections = (() => {
    if (loadingChoirAccess || (choirId && loadingChoirCtx) || (inProtocolArea && loadingProtocolCtx)) {
      return getPortalNavForUser(authRole, { canAccessChoirArea: false, isChoirMember: false }, permissions)
    }
    if (choirId && choirCtx) {
      return getComposedChoirNav(choirId, choirCtx.choir.name, choirCtx.permissions)
    }
    if (inProtocolArea && protocolCtx?.canAccess) {
      return getComposedProtocolNav(protocolCtx.ministry.name, protocolCtx.permissions)
    }
    return getNavForContext(pathname, authRole, { canAccessChoirArea, isChoirMember }, permissions, activeChoirMemberships)
  })()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-primary-900 text-text-inverse',
        'transition-[width] duration-normal ease-out',
        collapsed ? 'w-16' : 'w-[240px]',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 border-b border-primary-800',
        'h-16 shrink-0',
        collapsed && 'justify-center px-0',
      )}>
        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gold-500 shrink-0">
          <span className="font-display font-bold text-primary-900 text-sm">C</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-display font-semibold text-base text-text-inverse leading-tight truncate">
              CMMS
            </p>
            <p className="text-xs text-primary-300 truncate">Church System</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {sections.map((sec, si) => (
          <div key={si}>
            {sec.section && !collapsed && (
              <p className="px-4 mb-1 text-xs font-semibold uppercase tracking-widest text-primary-400">
                {sec.section}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {sec.items.map((item) => {
                const active = pathname === item.path ||
                  (item.path !== '/dashboard' && item.path !== '/portal' &&
                   pathname.startsWith(item.path))
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2.5',
                        'text-sm font-medium transition-colors duration-fast',
                        'relative overflow-hidden',
                        active
                          ? 'bg-primary-800 text-text-inverse'
                          : 'text-primary-300 hover:bg-primary-800/60 hover:text-text-inverse',
                        collapsed && 'justify-center px-0 w-10 mx-auto',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gold-500 rounded-full" />
                      )}
                      <Icon
                        size={18}
                        className={cn(
                          'shrink-0 transition-colors duration-fast',
                          active ? 'text-gold-400' : 'text-primary-400 group-hover:text-primary-200',
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-primary-800 p-2">
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center justify-center w-full rounded-md py-2',
            'text-primary-400 hover:text-text-inverse hover:bg-primary-800',
            'transition-colors duration-fast',
          )}
        >
          {collapsed
            ? <ChevronRight size={16} />
            : (
              <span className="flex items-center gap-2 text-xs">
                <ChevronLeft size={16} /> Collapse
              </span>
            )
          }
        </button>
      </div>
    </aside>
  )
}
