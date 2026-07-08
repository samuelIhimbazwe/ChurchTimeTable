'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Home, ClipboardList, Bell, MoreHorizontal, Music, Heart, Users, X, Briefcase,
} from 'lucide-react'
import { membershipOfficePath } from '@/lib/choir/membership-office'
import { cn } from '@/lib/utils'

type OfficeLink = { label: string; href: string }

type Props = {
  choirId: string
  activeSegment: string
  todoCount?: number
  offices?: OfficeLink[]
  pathname?: string
}

const PRIMARY_TABS = [
  { segment: '', label: 'Week', icon: Home },
  { segment: 'obligations', label: 'To do', icon: ClipboardList, showTodoBadge: true },
  { segment: 'notifications', label: 'Inbox', icon: Bell },
] as const

const MORE_LINKS = [
  { segment: 'attendance', label: 'Attendance', icon: Users },
  { segment: 'giving', label: 'Giving', icon: Heart },
  { segment: 'family', label: 'Family', icon: Users },
  { segment: 'music', label: 'Music', icon: Music },
] as const

export function MemberBottomTabBar({
  choirId,
  activeSegment,
  todoCount = 0,
  offices = [],
  pathname = '',
}: Props) {
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = MORE_LINKS.some((l) => l.segment === activeSegment)
  const officeActive = offices.some(
    (o) => pathname === o.href || pathname.startsWith(`${o.href}/`),
  )

  return (
    <>
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}

      {moreOpen && (
        <div className="lg:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-50 rounded-md border border-border bg-surface shadow-overlay p-3 safe-bottom">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">More</p>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="p-2 rounded-md text-text-muted touch-target"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          {offices.length > 0 && (
            <div className="mb-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                My offices
              </p>
              <div className={cn('grid gap-2', offices.length > 1 ? 'grid-cols-1' : 'grid-cols-1')}>
                {offices.map((office) => {
                  const active =
                    pathname === office.href || pathname.startsWith(`${office.href}/`)
                  return (
                    <Link
                      key={office.href}
                      href={office.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-3 rounded-md border text-sm font-semibold touch-target',
                        active
                          ? 'border-gold-500 bg-gold-50 text-gold-900'
                          : 'border-gold-200/80 bg-gold-50/50 hover:bg-gold-50',
                      )}
                    >
                      <Briefcase size={16} />
                      {office.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {MORE_LINKS.map(({ segment, label, icon: Icon }) => (
              <Link
                key={segment}
                href={membershipOfficePath(choirId, segment)}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-3 rounded-md border text-sm font-semibold touch-target',
                  activeSegment === segment
                    ? 'border-primary-500 bg-primary-50 text-primary-800'
                    : 'border-border hover:bg-surface-raised',
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md safe-bottom"
        aria-label="Membership navigation"
      >
        <div className="flex items-stretch justify-around px-1 pt-1">
          {PRIMARY_TABS.map(({ segment, label, icon: Icon, ...rest }) => {
            const active = activeSegment === segment
            const badge = 'showTodoBadge' in rest && rest.showTodoBadge ? todoCount : 0
            return (
              <Link
                key={segment || 'home'}
                href={membershipOfficePath(choirId, segment || undefined)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] touch-target text-[10px] font-semibold',
                  active ? 'text-primary-700' : 'text-text-muted',
                )}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={active ? 2.25 : 2} />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-warning text-white text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[3.5rem] touch-target text-[10px] font-semibold',
              moreActive || moreOpen || officeActive ? 'text-primary-700' : 'text-text-muted',
            )}
            aria-expanded={moreOpen}
          >
            <span className="relative">
              <MoreHorizontal size={20} />
              {offices.length > 0 && !moreOpen && !officeActive && (
                <span className="absolute -top-0.5 -right-1.5 h-2 w-2 rounded-full bg-gold-500" aria-hidden />
              )}
            </span>
            More
          </button>
        </div>
      </nav>

      <div className="lg:hidden h-[calc(4.5rem+env(safe-area-inset-bottom,0px))]" aria-hidden />
    </>
  )
}
