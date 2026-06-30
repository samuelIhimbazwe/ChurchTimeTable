'use client'

import { useState, useEffect } from 'react'
import { useUIStore } from '@/stores/index'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileDrawer from './MobileDrawer'
import { CommandPalette } from '@/components/navigation/CommandPalette'
import { NavigationTracker } from '@/components/navigation/NavigationTracker'
import { WorkspaceContextStrip } from '@/components/navigation/WorkspaceContextStrip'
import { SkipToMain } from '@/components/accessibility/SkipToMain'
import { ViewAsMemberBanner } from '@/components/governance/ViewAsMemberBanner'
import HelpPanel from './HelpPanel'
import PreferencesPanel from './PreferencesPanel'
import NotificationPanel from './NotificationPanel'
import { useNotifications } from '@/lib/hooks'
import { ProductTourProvider } from '@/components/tour/ProductTourProvider'
import { UnifiedAttentionDrawer } from '@/components/dashboard/UnifiedAttentionDrawer'
import { useAttentionItems } from '@/lib/dashboard/useAttentionItems'

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

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
  const [helpOpen,    setHelpOpen]    = useState(false)
  const [prefsOpen,   setPrefsOpen]   = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [attentionOpen, setAttentionOpen] = useState(false)

  const { data: notifications } = useNotifications()
  const { urgentCount: attentionCount } = useAttentionItems()
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
        return
      }
      if (e.key === '?' && !isTypingTarget(e.target)) {
        e.preventDefault()
        setHelpOpen((prev) => !prev)
        setNotifOpen(false)
        setPrefsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div data-theme={theme} className="min-h-screen bg-surface-raised overflow-x-hidden">
      <SkipToMain />

      <div className="hidden lg:block">
        <Sidebar role={role} variant="desktop" />
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
        onSearchClick={() => { setHelpOpen(false); setPrefsOpen(false); setSearchOpen(true) }}
        onHelpClick={() => { setNotifOpen(false); setPrefsOpen(false); setHelpOpen((prev) => !prev) }}
        onPreferencesClick={() => { setNotifOpen(false); setHelpOpen(false); setPrefsOpen(true) }}
        onNotifClick={() => { setHelpOpen(false); setPrefsOpen(false); setAttentionOpen(false); setNotifOpen((prev) => !prev) }}
        onAttentionClick={() => { setHelpOpen(false); setPrefsOpen(false); setNotifOpen(false); setAttentionOpen((prev) => !prev) }}
        attentionCount={attentionCount}
        notifOpen={notifOpen}
        attentionOpen={attentionOpen}
        helpOpen={helpOpen}
      />

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      <UnifiedAttentionDrawer
        open={attentionOpen}
        onClose={() => setAttentionOpen(false)}
      />

      <HelpPanel
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <PreferencesPanel
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
      />

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenNotifications={() => setNotifOpen(true)}
      />

      <NavigationTracker />

      <ProductTourProvider />

      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          'pt-[calc(4rem+env(safe-area-inset-top,0px))] min-h-[100dvh] min-w-0 max-w-full safe-x',
          'lg:transition-[margin-left] lg:duration-normal lg:ease-out',
          'lg:ml-[240px]',
          collapsed && 'lg:ml-16',
        )}
      >
        <div className="p-3 xs:p-4 sm:p-6 page-enter min-w-0 max-w-full pb-safe-bottom">
          <ViewAsMemberBanner className="mb-4 rounded-lg" />
          <WorkspaceContextStrip />
          {children}
        </div>
      </main>
    </div>
  )
}
