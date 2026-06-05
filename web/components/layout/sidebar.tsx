'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, Music, Shield,
  DollarSign, FileText, Settings2, Home, Clock,
  Heart, ChevronLeft, ChevronRight, Landmark,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/index'

/* ── Nav config ── */
type NavItem = { label: string; icon: React.ElementType; path: string }
type NavSection = { section?: string; items: NavItem[] }

const NAV_BY_ROLE: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    { items: [
      { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Members',     icon: Users,           path: '/members' },
      { label: 'Events',      icon: Calendar,        path: '/events' },
    ]},
    { section: 'Ministries', items: [
      { label: 'Choir',       icon: Music,           path: '/choir' },
      { label: 'Protocol',    icon: Shield,          path: '/protocol' },
      { label: 'Governance',  icon: Landmark,        path: '/governance' },
    ]},
    { section: 'Management', items: [
      { label: 'Finance',     icon: DollarSign,      path: '/finance' },
      { label: 'Reports',     icon: FileText,        path: '/reports' },
      { label: 'System',      icon: Settings2,       path: '/system' },
    ]},
  ],
  CHOIR_PRESIDENT: [
    { items: [
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/choir' },
    ]},
    { section: 'Operations', items: [
      { label: 'Activities',    icon: Calendar,        path: '/choir/activities' },
      { label: 'Roster',        icon: Users,           path: '/choir/members' },
      { label: 'Attendance',    icon: CheckCircle2,    path: '/choir/activities' },
    ]},
    { section: 'Leadership', items: [
      { label: 'Stewardship',   icon: DollarSign,      path: '/choir/stewardship' },
      { label: 'Welfare',       icon: Heart,           path: '/choir/welfare' },
      { label: 'Discipline',    icon: Shield,          path: '/choir/discipline' },
      { label: 'Reports',       icon: FileText,        path: '/choir/reports' },
    ]},
  ],
  CHOIR_SECRETARY: [
    { items: [
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/choir' },
    ]},
    { section: 'Operations', items: [
      { label: 'Activities',    icon: Calendar,        path: '/choir/activities' },
      { label: 'Roster',        icon: Users,           path: '/choir/members' },
    ]},
  ],
  CHOIR_TREASURER: [
    { items: [
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/choir' },
    ]},
    { section: 'Finance', items: [
      { label: 'Stewardship',   icon: DollarSign,      path: '/choir/stewardship' },
      { label: 'Reports',       icon: FileText,        path: '/choir/reports' },
    ]},
  ],
  CHOIR_REHEARSAL_DIRECTOR: [
    { items: [
      { label: 'Dashboard',     icon: LayoutDashboard, path: '/choir' },
    ]},
    { section: 'Rehearsals', items: [
      { label: 'Activities',    icon: Calendar,        path: '/choir/activities' },
      { label: 'Roster',        icon: Users,           path: '/choir/members' },
    ]},
  ],
  PROTOCOL_LEADER: [
    { items: [
      { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Events',      icon: Calendar,        path: '/events' },
    ]},
    { section: 'Protocol', items: [
      { label: 'Assignments', icon: Shield,          path: '/protocol/assignments' },
      { label: 'Members',     icon: Users,           path: '/protocol/members' },
      { label: 'Reports',     icon: FileText,        path: '/protocol/reports' },
    ]},
  ],
  CHURCH_ADMIN: [
    { items: [
      { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard' },
      { label: 'Members',     icon: Users,           path: '/members' },
      { label: 'Events',      icon: Calendar,        path: '/events' },
    ]},
    { section: 'Management', items: [
      { label: 'Choir',       icon: Music,           path: '/choir' },
      { label: 'Protocol',    icon: Shield,          path: '/protocol' },
      { label: 'Finance',     icon: DollarSign,      path: '/finance' },
      { label: 'Reports',     icon: FileText,        path: '/reports' },
    ]},
  ],
  MEMBER: [
    { items: [
      { label: 'My Portal',   icon: Home,            path: '/portal' },
      { label: 'Events',      icon: Calendar,        path: '/events' },
      { label: 'My Schedule', icon: Clock,           path: '/portal/schedule' },
      { label: 'Welfare',     icon: Heart,           path: '/portal/welfare' },
    ]},
  ],
}

/* ── Component ── */
export default function Sidebar({ role = 'MEMBER' }: { role?: string }) {
  const pathname  = usePathname()
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle    = useUIStore((s) => s.toggleSidebar)

  const sections = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.MEMBER

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
                      {/* Gold active bar */}
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
