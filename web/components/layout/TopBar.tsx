'use client'

import { useState } from 'react'
import {
  Bell, Search, HelpCircle, ChevronDown,
  Sun, Moon, LogOut, User, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/index'
import { useLogout } from '@/lib/hooks'

interface TopBarProps {
  pageTitle:    string
  userName?:    string
  userRole?:    string
  unreadCount?: number
}

export default function TopBar({
  pageTitle,
  userName    = 'User',
  userRole    = 'Member',
  unreadCount = 0,
}: TopBarProps) {
  const collapsed  = useUIStore((s) => s.sidebarCollapsed)
  const theme      = useUIStore((s) => s.theme)
  const setTheme   = useUIStore((s) => s.setTheme)
  const [menuOpen, setMenuOpen] = useState(false)

  const { mutate: logout, isPending: loggingOut } = useLogout()

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16',
        'flex items-center justify-between px-6 gap-4',
        'bg-surface border-b border-border',
        'transition-[left] duration-normal ease-out',
        collapsed ? 'left-16' : 'left-[240px]',
      )}
    >
      <h1 className="font-body font-semibold text-xl text-text-primary truncate">
        {pageTitle}
      </h1>

      <div className="flex items-center gap-2 shrink-0">

        {/* Search */}
        <button
          aria-label="Open search"
          className={cn(
            'hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md',
            'bg-surface-raised border border-border',
            'text-sm text-text-muted hover:text-text-primary',
            'transition-colors duration-fast',
          )}
        >
          <Search size={15} />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline text-xs bg-surface-overlay px-1.5 py-0.5 rounded border border-border font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Theme */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
          className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors duration-fast"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Help */}
        <button
          aria-label="Help"
          className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors duration-fast"
        >
          <HelpCircle size={18} />
        </button>

        {/* Notifications */}
        <button
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
          className="relative p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors duration-fast"
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

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open profile menu"
            aria-expanded={menuOpen}
            className={cn(
              'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-md',
              'hover:bg-surface-raised transition-colors duration-fast',
            )}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-700 text-text-inverse text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-text-primary leading-tight truncate max-w-[120px]">
                {userName}
              </p>
              <p className="text-xs text-text-muted leading-tight">{userRole}</p>
            </div>
            <ChevronDown size={14} className="text-text-muted hidden md:block" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className={cn(
                'absolute right-0 top-full mt-2 z-50',
                'w-52 bg-surface rounded-lg border border-border shadow-overlay',
                'animate-page-enter',
              )}>
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-text-primary truncate">{userName}</p>
                  <p className="text-xs text-text-muted">{userRole}</p>
                </div>
                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors">
                    <User size={15} /> My Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-raised hover:text-text-primary transition-colors">
                    <Settings size={15} /> Preferences
                  </button>
                </div>
                <div className="py-1 border-t border-border">
                  <button
                    onClick={() => { setMenuOpen(false); logout() }}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger-light transition-colors disabled:opacity-50"
                  >
                    <LogOut size={15} />
                    {loggingOut ? 'Signing out…' : 'Sign out'}
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
