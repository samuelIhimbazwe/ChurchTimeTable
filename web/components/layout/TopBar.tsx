'use client'

import { useState } from 'react'
import {
  Bell, Search, HelpCircle, ChevronDown,
  LogOut, User, Settings, Menu, Inbox, MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/index'
import { useLogout } from '@/lib/hooks'
import { AppearanceControls } from '@/components/auth/AppearanceControls'
import { useTranslations } from '@/lib/i18n'
import { BackButton } from '@/components/shared/BackButton'
import { isSovereignOfficePath } from '@/lib/choir/office-themes'
import { shouldShowBackButton } from '@/lib/navigation/back-target'
import { usePathname } from 'next/navigation'
import { accountProfilePath } from '@/lib/account/paths'
import { useDualMemberPortalAccess } from '@/lib/portal/access'

interface TopBarProps {
  pageTitle:     string
  userName?:     string
  userRole?:     string
  unreadCount?:  number
  onMenuClick?:  () => void
  onSearchClick?:() => void
  onHelpClick?:  () => void
  onPreferencesClick?: () => void
  onNotifClick?: () => void
  onAttentionClick?: () => void
  notifOpen?:    boolean
  attentionOpen?: boolean
  attentionCount?: number
  helpOpen?:     boolean
}

export default function TopBar({
  pageTitle,
  userName     = 'User',
  userRole     = 'Member',
  unreadCount  = 0,
  onMenuClick,
  onSearchClick,
  onHelpClick,
  onPreferencesClick,
  onNotifClick,
  onAttentionClick,
  notifOpen    = false,
  attentionOpen = false,
  attentionCount = 0,
  helpOpen     = false,
}: TopBarProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const [menuOpen, setMenuOpen] = useState(false)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const { tr } = useTranslations()
  const pathname = usePathname()
  const { isDualMember } = useDualMemberPortalAccess()
  const profileHref = accountProfilePath(isDualMember)
  const showTopBarBack =
    shouldShowBackButton(pathname) && !isSovereignOfficePath(pathname)

  const { mutate: logout, isPending: loggingOut } = useLogout()

  const initials = userName
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30',
        'h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)]',
        'flex items-center justify-between px-4 sm:px-6 gap-2 min-w-0 safe-x',
        'bg-surface/90 backdrop-blur-md border-b border-border',
        'left-0',
        'lg:transition-[left] lg:duration-fast lg:ease-out',
        'lg:left-sidebar',
        collapsed && 'lg:left-sidebar-collapsed',
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          data-tour="nav-sidebar"
          className="lg:hidden icon-btn -ml-1"
        >
          <Menu size={18} />
        </button>

        {showTopBarBack && <BackButton variant="icon" />}

        <h1 className="font-display font-medium text-lg sm:text-xl text-text-primary truncate min-w-0 tracking-tight">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">

        <button
          onClick={onSearchClick}
          aria-label="Open search"
          data-tour="topbar-search"
          className={cn(
            'hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md',
            'border border-border bg-surface-raised/50',
            'text-xs text-text-muted hover:text-text-secondary hover:border-border-strong',
            'transition-colors duration-fast',
          )}
        >
          <Search size={14} />
          <span className="hidden md:inline">{tr('Search')}</span>
          <kbd className="hidden md:inline text-[10px] text-text-muted px-1 py-0.5 rounded border border-border font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onSearchClick}
          aria-label="Search"
          data-tour="topbar-search"
          className="sm:hidden icon-btn"
        >
          <Search size={17} />
        </button>

        <AppearanceControls compact className="hidden sm:flex" />

        {onAttentionClick && (
          <button
            onClick={onAttentionClick}
            aria-label={`Attention inbox${attentionCount ? `, ${attentionCount} items` : ''}`}
            aria-expanded={attentionOpen}
            data-tour="topbar-attention"
            className={cn('relative hidden sm:inline-flex icon-btn', attentionOpen && 'icon-btn-active')}
          >
            <Inbox size={17} />
            {attentionCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-warning text-[9px] font-semibold text-white flex items-center justify-center">
                {attentionCount > 9 ? '9+' : attentionCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onHelpClick}
          aria-label="Help and support"
          aria-expanded={helpOpen}
          data-tour="topbar-help"
          className={cn('hidden sm:inline-flex icon-btn', helpOpen && 'icon-btn-active')}
        >
          <HelpCircle size={17} />
        </button>

        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            aria-label="More actions"
            aria-expanded={overflowOpen}
            className="icon-btn"
          >
            <MoreHorizontal size={17} />
          </button>
          {overflowOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOverflowOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-surface rounded-md border border-border shadow-overlay py-1">
                {onAttentionClick && (
                  <button
                    type="button"
                    onClick={() => { setOverflowOpen(false); onAttentionClick() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                  >
                    <Inbox size={15} />
                    {tr('Attention')}
                    {attentionCount > 0 && (
                      <span className="ml-auto min-w-[16px] h-4 px-1 rounded-full bg-warning text-white text-[10px] font-medium flex items-center justify-center">
                        {attentionCount > 9 ? '9+' : attentionCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setOverflowOpen(false); onHelpClick?.() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                >
                  <HelpCircle size={15} />
                  {tr('Help')}
                </button>
                <div className="px-3 py-2 border-t border-border">
                  <AppearanceControls compact />
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onNotifClick}
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          data-tour="topbar-notifications"
          className={cn('relative icon-btn', notifOpen && 'icon-btn-active')}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-danger text-white text-[9px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="relative ml-0.5">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Profile menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-surface-raised transition-colors duration-fast"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-900 text-text-inverse text-[10px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-medium text-text-primary leading-tight truncate max-w-[108px]">
                {userName}
              </p>
              <p className="text-[11px] text-text-muted leading-tight">{tr(userRole)}</p>
            </div>
            <ChevronDown size={13} className="text-text-muted hidden md:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className={cn(
                'absolute right-0 top-full mt-1.5 z-50',
                'w-48 bg-surface rounded-md border border-border shadow-overlay',
              )}>
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
                  <p className="text-[11px] text-text-muted">{tr(userRole)}</p>
                </div>
                <div className="py-1">
                  <a href={profileHref} className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors">
                    <User size={14} /> {tr('My Profile')}
                  </a>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onPreferencesClick?.() }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                  >
                    <Settings size={14} /> {tr('Preferences')}
                  </button>
                </div>
                <div className="py-1 border-t border-border">
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger-light transition-colors disabled:opacity-50"
                  >
                    <LogOut size={14} />
                    {loggingOut ? tr('Signing out…') : tr('Sign out')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
