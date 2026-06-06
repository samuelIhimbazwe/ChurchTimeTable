'use client'

import { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/index'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileDrawer from './MobileDrawer'
import SearchModal from './SearchModal'
import NotificationPanel from './NotificationPanel'
import { useNotifications } from '@/lib/hooks'

interface ShellProps {
  children:     React.ReactNode
  pageTitle:    string
  role?:        string
  userName?:    string
  userRole?:    string
}

export default function Shell({
  children,
  pageTitle,
  role,
  userName,
  userRole,
}: ShellProps) {
  const collapsed  = useUIStore((s) => s.sidebarCollapsed)
  const theme      = useUIStore((s) => s.theme)

  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)

  const { data: notifications } = useNotifications()
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div data-theme={theme} className="min-h-screen bg-surface-raised">

      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role={role}
      />

      <TopBar
        pageTitle={pageTitle}
        userName={userName}
        userRole={userRole}
        unreadCount={unreadCount}
        onMenuClick={() => setDrawerOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        onNotifClick={() => setNotifOpen((prev) => !prev)}
        notifOpen={notifOpen}
      />

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <main
        className={cn(
          'pt-16 min-h-screen',
          'lg:transition-[margin-left] lg:duration-normal lg:ease-out',
          'lg:ml-[240px]',
          collapsed && 'lg:ml-16',
        )}
      >
        <div className="p-4 sm:p-6 page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
