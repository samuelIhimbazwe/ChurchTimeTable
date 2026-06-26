'use client'

import Link from 'next/link'
import { useRef } from 'react'
import {
  X, HelpCircle, Search, Home, User, Bell, Menu,
  Keyboard, Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'
import { KEYBOARD_SHORTCUTS } from '@/lib/accessibility/keyboard-shortcuts'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

interface HelpPanelProps {
  open:    boolean
  onClose: () => void
  onOpenSearch?: () => void
}

export default function HelpPanel({ open, onClose, onOpenSearch }: HelpPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)
  const { shell: s, tr } = useTranslations()

  if (!open) return null

  const quickLinks = [
    { href: '/portal', label: tr('Member portal'), icon: Home, desc: s.memberPortalDesc },
    { href: '/portal/profile', label: tr('My Profile'), icon: User, desc: s.myProfileDesc },
    { href: '/dashboard', label: tr('Dashboard'), icon: Home, desc: s.dashboardDesc },
  ]

  const shortcutGroups = KEYBOARD_SHORTCUTS.reduce<Record<string, typeof KEYBOARD_SHORTCUTS>>(
    (acc, item) => {
      acc[item.group] = acc[item.group] ?? []
      acc[item.group].push(item)
      return acc
    },
    {},
  )

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={s.helpTitle}
        className="fixed top-below-topbar left-3 right-3 sm:left-auto sm:right-4 z-50 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface rounded-xl border border-border shadow-overlay animate-page-enter overflow-hidden max-h-below-topbar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">{s.helpTitle}</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label={tr('Close')}>
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              {tr('Keyboard shortcuts')}
            </p>
            <div className="space-y-3">
              {Object.entries(shortcutGroups).map(([group, items]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
                    {group}
                  </p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li
                        key={`${group}-${item.keys}`}
                        className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-surface-raised"
                      >
                        <span className="text-xs text-text-secondary">{item.label}</span>
                        <kbd className="text-[10px] font-mono bg-surface-raised border border-border px-1.5 py-0.5 rounded text-text-muted shrink-0">
                          {item.keys}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              {s.quickActions}
            </p>
            <ul className="space-y-1">
              {quickLinks.map(({ href, label, icon: Icon, desc }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-raised transition-colors"
                  >
                    <Icon size={16} className="text-primary-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-muted">{desc}</p>
                    </div>
                  </Link>
                </li>
              ))}
              {onOpenSearch && (
                <li>
                  <button
                    type="button"
                    onClick={() => { onClose(); onOpenSearch() }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-raised transition-colors text-left"
                  >
                    <Search size={16} className="text-primary-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{s.searchSystem}</p>
                      <p className="text-xs text-text-muted">{s.searchSystemDesc}</p>
                    </div>
                  </button>
                </li>
              )}
            </ul>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              {s.tips}
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <Keyboard size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>{s.tipSearch}</span>
              </li>
              <li className="flex items-start gap-2">
                <Menu size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>{s.tipMobileMenu}</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>{s.tipBell}</span>
              </li>
              <li className="flex items-start gap-2">
                <Smartphone size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>{s.tipContact}</span>
              </li>
            </ul>
          </section>

          <p className={cn('text-xs text-text-muted border-t border-border pt-3')}>
            {s.helpFooter}
          </p>
        </div>
      </div>
    </>
  )
}
