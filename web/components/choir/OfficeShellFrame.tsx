'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OfficeThemeKey } from '@/lib/choir/office-themes'
import { OFFICE_THEMES } from '@/lib/choir/office-themes'

export type OfficeNavItem = {
  id: string
  label: string
  href: string
  active: boolean
  badge?: number
}

type Props = {
  themeKey: OfficeThemeKey
  choirName: string
  title: string
  subtitle: string
  meta?: React.ReactNode
  roleBadge?: string
  navItems: OfficeNavItem[]
  navLabel: string
  alerts?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}

export function OfficeShellFrame({
  themeKey,
  choirName,
  title,
  subtitle,
  meta,
  roleBadge,
  navItems,
  navLabel,
  alerts,
  aside,
  children,
}: Props) {
  const theme = OFFICE_THEMES[themeKey]
  const Icon = theme.icon

  return (
    <div
      className={`-mx-3 sm:-mx-6 -mt-3 sm:-mt-6 border-l-4 ${theme.accentBorder}`}
      data-office={themeKey}
    >
      <header className={theme.hero}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4 min-w-0">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.iconWrap}`}
              >
                <Icon size={28} className={theme.iconColor} aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.eyebrow}`}
                >
                  {theme.officeKindLabel} · {choirName}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={`font-display text-3xl leading-tight ${theme.heroText}`}>
                    {title}
                  </h1>
                  {roleBadge && (
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${theme.badge}`}
                    >
                      {roleBadge}
                    </span>
                  )}
                </div>
                <p className={`text-sm max-w-2xl ${theme.heroMuted}`}>{subtitle}</p>
                {meta && (
                  <div className={`text-sm pt-0.5 ${theme.heroMuted}`}>{meta}</div>
                )}
              </div>
            </div>
            <Link
              href="/portal"
              className={`inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 mt-1 ${theme.portalLink}`}
            >
              <ArrowLeft size={14} />
              Member portal
            </Link>
          </div>
        </div>
      </header>

      <div className="sticky top-16 z-20 bg-surface border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
          <nav
            className="flex flex-wrap gap-1.5"
            aria-label={navLabel}
          >
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                aria-current={item.active ? 'page' : undefined}
                className={cn(
                  'px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors',
                  item.active
                    ? 'bg-primary-700 text-white shadow-sm'
                    : 'text-text-primary bg-surface-raised border border-border hover:border-primary-300 hover:bg-primary-50',
                )}
              >
                {item.label}
                {item.badge != null && item.badge > 0 && (
                  <span
                    className={cn(
                      'ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      item.active ? 'bg-white/20 text-white' : 'bg-warning text-white',
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className={theme.contentBg}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-10">
          <div className={aside ? 'lg:grid lg:grid-cols-[1fr_240px] lg:gap-8' : undefined}>
            <div className="min-w-0 space-y-5">
              {alerts}
              {children}
            </div>
            {aside && (
              <aside className="hidden lg:block space-y-4 pt-1">{aside}</aside>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
