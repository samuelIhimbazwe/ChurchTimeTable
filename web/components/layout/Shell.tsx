'use client'

import { useUIStore } from '@/stores/index'
import { cn } from '@/lib/utils'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface ShellProps {
  children: React.ReactNode
  pageTitle: string
  role?: string
  userName?: string
  userRole?: string
  unreadCount?: number
}

export default function Shell({
  children,
  pageTitle,
  role,
  userName,
  userRole,
  unreadCount,
}: ShellProps) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const theme     = useUIStore((s) => s.theme)

  return (
    <div data-theme={theme} className="min-h-screen bg-surface-raised">
      <Sidebar role={role} />
      <TopBar
        pageTitle={pageTitle}
        userName={userName}
        userRole={userRole}
        unreadCount={unreadCount}
      />
      <main
        className={cn(
          'pt-16 min-h-screen',
          'transition-[margin-left] duration-normal ease-out',
          collapsed ? 'ml-16' : 'ml-[240px]',
        )}
      >
        <div className="p-6 page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
