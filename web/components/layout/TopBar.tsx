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
  const showTopBarBack =
    shouldShowBackButton(pathname) && !isSovereignOfficePath(pathname)

  const { mutate: logout, isPending: loggingOut } = useLogout()

  const initials = userName
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30',
        'h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)]',
        'flex items-center justify-between px-3 xs:px-4 sm:px-6 gap-1.5 sm:gap-4 min-w-0 safe-x',
        'bg-surface border-b border-border',
        'left-0',
        'lg:transition-[left] lg:duration-normal lg:ease-out',
        'lg:left-[240px]',
        collapsed && 'lg:left-16',
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          data-tour="nav-sidebar"
          className="lg:hidden p-2 -ml-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors shrink-0 touch-target"
        >
          <Menu size={20} />
        </button>

        {showTopBarBack && <BackButton variant="icon" />}

        <h1 className="font-body font-semibold text-base sm:text-xl text-text-primary truncate min-w-0">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">

        <button
          onClick={onSearchClick}
          aria-label="Open search"
          data-tour="topbar-search"
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md',
            'bg-surface-raised border border-border',
            'text-sm text-text-muted hover:text-text-primary',
            'transition-colors duration-fast',
          )}
        >
          <Search size={15} />
          <span className="hidden md:inline">{tr('Search')}</span>
          <kbd className="hidden md:inline text-xs bg-surface-overlay px-1.5 py-0.5 rounded border border-border font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onSearchClick}
          aria-label="Search"
          data-tour="topbar-search"
          className="sm:hidden p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
        >
          <Search size={18} />
        </button>

        <AppearanceControls compact className="hidden sm:flex" />

        {onAttentionClick && (
          <button
            onClick={onAttentionClick}
            aria-label={`Attention inbox${attentionCount ? `, ${attentionCount} items` : ''}`}
            aria-expanded={attentionOpen}
            data-tour="topbar-attention"
            className={cn(
              'relative hidden sm:flex p-2 rounded-md transition-colors duration-fast touch-target',
              attentionOpen
                ? 'bg-surface-overlay text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-raised',
            )}
          >
            <Inbox size={18} />
            {attentionCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-warning text-[10px] font-bold text-white flex items-center justify-center">
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
          className={cn(
            'hidden sm:flex p-2 rounded-md transition-colors duration-fast touch-target',
            helpOpen
              ? 'bg-surface-overlay text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-raised',
          )}
        >
          <HelpCircle size={18} />
        </button>

        <div className="relative sm:hidden">
          <button
            type="button"
            onClick={() => setOverflowOpen((v) => !v)}
            aria-label="More actions"
            aria-expanded={overflowOpen}
            className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors touch-target"
          >
            <MoreHorizontal size={18} />
          </button>
          {overflowOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOverflowOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-surface rounded-lg border border-border shadow-overlay py-1 animate-page-enter">
                {onAttentionClick && (
                  <button
                    type="button"
                    onClick={() => { setOverflowOpen(false); onAttentionClick() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                  >
                    <Inbox size={15} />
                    {tr('Attention')}
                    {attentionCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-white text-[10px] font-semibold flex items-center justify-center">
                        {attentionCount > 9 ? '9+' : attentionCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setOverflowOpen(false); onHelpClick?.() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                >
                  <HelpCircle size={15} />
                  {tr('Help')}
                </button>
                <div className="px-4 py-2 border-t border-border">
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
          className={cn(
            'relative p-2 rounded-md transition-colors duration-fast touch-target',
            notifOpen
              ? 'bg-surface-overlay text-text-primary'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-raised',
          )}
        >
          <Bell size={18} className={unreadCount ? 'animate-bell-wiggle' : ''} />
          {unreadCount > 0 && (
            <span className={cn(
              'absolute top-1 right-1 flex items-center justify-center',
              'min-w-[18px] h-[18px] px-1 rounded-full',
              'bg-danger text-white text-[10px] font-semibold animate-scale-pop',
            )}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Profile menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-md hover:bg-surface-raised transition-colors duration-fast"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-700 text-text-inverse text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary leading-tight truncate max-w-[120px]">
                {userName}
              </p>
              <p className="text-xs text-text-muted leading-tight">{tr(userRole)}</p>
            </div>
            <ChevronDown size={14} className="text-text-muted hidden md:block" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className={cn(
                'absolute right-0 top-full mt-2 z-50',
                'w-52 bg-surface rounded-lg border border-border shadow-overlay',
                'animate-page-enter',
              )}>
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary truncate">{userName}</p>
                  <p className="text-xs text-text-muted">{tr(userRole)}</p>
                </div>
                <div className="py-1">
                  <a href="/portal/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors">
                    <User size={15} /> {tr('My Profile')}
                  </a>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onPreferencesClick?.() }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors"
                  >
                    <Settings size={15} /> {tr('Preferences')}
                  </button>
                </div>
                <div className="py-1 border-t border-border">
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger-light transition-colors disabled:opacity-50"
                  >
                    <LogOut size={15} />
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
