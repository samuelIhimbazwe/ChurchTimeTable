'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore } from '@/stores/index'
import { translateNavSections, useTranslations } from '@/lib/i18n'
import { getNavForContext, getPortalNavForUser } from '@/lib/navigation/role-nav'
import { getComposedChoirNav } from '@/lib/navigation/choir-nav'
import { composeContributionAwareNav } from '@/lib/navigation/contribution-nav'
import { composeWelfareAwareNav } from '@/lib/navigation/welfare-nav'
import { composeDisciplineAwareNav } from '@/lib/navigation/discipline-nav'
import { composeOpsAwareNav } from '@/lib/navigation/ops-nav'
import { composeJoinAwareNav } from '@/lib/navigation/join-nav'
import { composeSponsorAwareNav } from '@/lib/navigation/sponsor-nav'
import { composeMusicAwareNav } from '@/lib/navigation/music-nav'
import { composeRosterAwareNav } from '@/lib/navigation/roster-nav'
import { composeCommsAwareNav } from '@/lib/navigation/comms-nav'
import { composeVoiceAwareNav } from '@/lib/navigation/voice-nav'
import { composeLogisticsAwareNav } from '@/lib/navigation/logistics-nav'
import { composeDevotionAwareNav } from '@/lib/navigation/devotion-nav'
import { composeRolesAwareNav } from '@/lib/navigation/roles-nav'
import { composeAdminHubAwareNav } from '@/lib/navigation/admin-hub-nav'
import { composeCareHubAwareNav } from '@/lib/navigation/care-hub-nav'
import { composeRecordsHubAwareNav } from '@/lib/navigation/records-hub-nav'
import { composePresidentHubAwareNav } from '@/lib/navigation/president-hub-nav'
import { composeVicePresidentHubAwareNav } from '@/lib/navigation/vice-president-hub-nav'
import { composeAdvisorHubAwareNav } from '@/lib/navigation/advisor-hub-nav'
import { composeFamilyAwareNav } from '@/lib/navigation/family-nav'
import { useCapabilityRouter } from '@/lib/hooks/useCapability'
import { getComposedProtocolNav } from '@/lib/navigation/protocol-nav'
import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { isProtocolDashboardPath } from '@/lib/protocol/paths'
import { useChoirAccess } from '@/lib/hooks/useChoirAccess'
import { useChoirDashboardContext } from '@/lib/hooks/useChoirDashboardContext'
import { useProtocolDashboardContext } from '@/lib/hooks/useProtocolDashboardContext'
import { useDualMemberPortalAccess } from '@/lib/portal/access'

const EMPTY_PERMISSIONS: string[] = []

type SidebarVariant = 'desktop' | 'mobile'

export default function Sidebar({
  role = 'MEMBER',
  variant = 'desktop',
  onNavigate,
}: {
  role?: string
  variant?: SidebarVariant
  onNavigate?: () => void
}) {
  const pathname  = usePathname()
  const isMobile  = variant === 'mobile'
  const collapsed = useUIStore((s) => s.sidebarCollapsed) && !isMobile
  const toggle    = useUIStore((s) => s.toggleSidebar)
  const locale    = useUIStore((s) => s.locale)
  const { tr }    = useTranslations()
  const authRole  = useAuthStore((s) => s.user?.role) ?? role
  const permissions = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS)
  const choirId = parseChoirIdFromPath(pathname)
  const {
    activeChoirMemberships,
    isLoading: loadingChoirAccess,
    primaryChoirId,
    canAccessChoirArea,
    isChoirMember,
  } = useChoirAccess()
  const contextChoirId =
    choirId
    ?? (pathname.startsWith('/choir')
      ? (primaryChoirId ?? activeChoirMemberships[0]?.id)
      : undefined)
  const inProtocolArea = isProtocolDashboardPath(pathname)
  const { data: choirCtx } = useChoirDashboardContext(contextChoirId)
  const contributionAuth = choirCtx?.contributionAuth
  const welfareAuth = choirCtx?.welfareAuth
  const disciplineAuth = choirCtx?.disciplineAuth
  const opsAuth = choirCtx?.opsAuth
  const joinAuth = choirCtx?.joinAuth
  const sponsorAuth = choirCtx?.sponsorAuth
  const musicAuth = choirCtx?.musicAuth
  const rosterAuth = choirCtx?.rosterAuth
  const commsAuth = choirCtx?.commsAuth
  const voiceAuth = choirCtx?.voiceAuth
  const logisticsAuth = choirCtx?.logisticsAuth
  const rolesAuth = choirCtx?.rolesAuth
  const capabilityCheck = useCapabilityRouter(contextChoirId ?? choirId ?? undefined)
  const { data: protocolCtx, isLoading: loadingProtocolCtx } = useProtocolDashboardContext(inProtocolArea)
  const { isDualMember, isLoading: loadingPortalAccess } = useDualMemberPortalAccess()

  const membershipForPath = choirId
    ? activeChoirMemberships.find((m) => m.id === choirId)
    : undefined

  const rawSections = (() => {
    if (loadingChoirAccess || loadingPortalAccess || (inProtocolArea && loadingProtocolCtx)) {
      return getPortalNavForUser(authRole, { canAccessChoirArea: false, isChoirMember: false }, [], { isDualMember: false, primaryChoirId: null })
    }
    if (choirId && (choirCtx || membershipForPath) && membershipForPath) {
      return getComposedChoirNav(
        choirId,
        choirCtx?.choir.name ?? membershipForPath!.name,
        choirCtx?.permissions ?? permissions,
        choirCtx?.familyOffices ?? [],
        choirCtx?.positions ?? [],
        contributionAuth,
        choirCtx ? capabilityCheck : undefined,
        { isDualMember },
      )
    }
    if (inProtocolArea && protocolCtx?.canAccess) {
      return getComposedProtocolNav(
        protocolCtx.ministry.name,
        protocolCtx.permissions,
        protocolCtx.positions,
        { isDualMember },
      )
    }
    return getNavForContext(
      pathname,
      authRole,
      { canAccessChoirArea, isChoirMember },
      permissions,
      activeChoirMemberships,
      choirCtx ? capabilityCheck : undefined,
      { isDualMember, primaryChoirId },
    )
  })()

  const capabilityAwareSections = composeAdminHubAwareNav(
    composeCareHubAwareNav(
      composeRolesAwareNav(
        composeAdvisorHubAwareNav(
          composeFamilyAwareNav(
        composeRecordsHubAwareNav(
          composeDevotionAwareNav(
            composeLogisticsAwareNav(
              composeVoiceAwareNav(
                composeCommsAwareNav(
                  composeRosterAwareNav(
                    composeMusicAwareNav(
                      composeSponsorAwareNav(
                        composeJoinAwareNav(
                          composeVicePresidentHubAwareNav(
                            composePresidentHubAwareNav(
                              composeOpsAwareNav(
                              composeDisciplineAwareNav(
                                composeWelfareAwareNav(
                                  composeContributionAwareNav(
                                    rawSections,
                                    contextChoirId ?? choirId,
                                    contributionAuth,
                                  ),
                                  contextChoirId ?? choirId,
                                  welfareAuth,
                                ),
                                contextChoirId ?? choirId,
                                disciplineAuth,
                              ),
                              contextChoirId ?? choirId,
                              opsAuth,
                            ),
                            contextChoirId ?? choirId,
                            capabilityCheck,
                          ),
                          contextChoirId ?? choirId,
                          capabilityCheck,
                        ),
                          contextChoirId ?? choirId,
                          joinAuth,
                        ),
                        contextChoirId ?? choirId,
                        sponsorAuth,
                      ),
                      contextChoirId ?? choirId,
                      musicAuth,
                    ),
                    contextChoirId ?? choirId,
                    rosterAuth,
                  ),
                  contextChoirId ?? choirId,
                  commsAuth,
                ),
                contextChoirId ?? choirId,
                voiceAuth,
              ),
              contextChoirId ?? choirId,
              logisticsAuth,
            ),
            contextChoirId ?? choirId,
            capabilityCheck,
          ),
          contextChoirId ?? choirId,
          capabilityCheck,
        ),
          contextChoirId ?? choirId,
          capabilityCheck,
        ),
          contextChoirId ?? choirId,
          capabilityCheck,
        ),
        contextChoirId ?? choirId,
        rolesAuth,
      ),
      contextChoirId ?? choirId,
      capabilityCheck,
    ),
    contextChoirId ?? choirId,
    capabilityCheck,
  )

  const sections = useMemo(
    () => translateNavSections(capabilityAwareSections, locale),
    [capabilityAwareSections, locale],
  )

  return (
    <aside
      data-tour="nav-sidebar"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-surface border-r border-border',
        'transition-[width] duration-fast ease-out',
        isMobile ? 'w-[min(260px,85vw)]' : collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 border-b border-border',
        'h-14 shrink-0',
        collapsed && 'justify-center px-0',
      )}>
        <div className="flex items-center justify-center w-7 h-7 rounded-sm border border-gold-500/40 bg-gold-50 shrink-0">
          <span className="font-display font-semibold text-gold-700 text-sm leading-none">C</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0">
            <p className="font-display font-semibold text-[15px] text-text-primary leading-tight truncate tracking-tight">
              CMMS
            </p>
            <p className="text-[11px] text-text-muted truncate">{tr('Choir & Protocol')}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-5 scrollbar-thin">
        {sections.map((sec, si) => (
          <div key={si}>
            {sec.section && !collapsed && (
              <p className="px-4 mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted">
                {sec.section}
              </p>
            )}
            <ul className="space-y-px px-2">
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
                      onClick={onNavigate}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-md px-2.5 py-2',
                        'text-[13px] transition-colors duration-fast',
                        'relative',
                        active
                          ? 'bg-surface-raised text-text-primary font-medium'
                          : 'text-text-secondary hover:bg-surface-raised/80 hover:text-text-primary font-normal',
                        collapsed && 'justify-center px-0 w-9 mx-auto',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gold-500 rounded-full" />
                      )}
                      <Icon
                        size={16}
                        strokeWidth={active ? 2.25 : 1.75}
                        className={cn(
                          'shrink-0 transition-colors duration-fast',
                          active ? 'text-gold-600' : 'text-text-muted group-hover:text-text-secondary',
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

      {/* Collapse — desktop only */}
      {!isMobile && (
        <div className="shrink-0 border-t border-border p-2">
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex items-center justify-center w-full rounded-md py-1.5',
              'text-text-muted hover:text-text-primary hover:bg-surface-raised',
              'transition-colors duration-fast text-xs',
            )}
          >
            {collapsed
              ? <ChevronRight size={15} />
              : (
                <span className="flex items-center gap-1.5">
                  <ChevronLeft size={15} /> {tr('Collapse')}
                </span>
              )
            }
          </button>
        </div>
      )}
    </aside>
  )
}
