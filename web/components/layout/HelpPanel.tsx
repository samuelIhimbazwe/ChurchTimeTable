'use client'

import Link from 'next/link'
import {
  X, HelpCircle, Search, Home, User, Bell, Menu,
  Keyboard, Smartphone,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpPanelProps {
  open:    boolean
  onClose: () => void
  onOpenSearch?: () => void
}

const QUICK_LINKS = [
  { href: '/portal', label: 'Member portal', icon: Home, desc: 'Your home, schedule, and choirs' },
  { href: '/portal/profile', label: 'My profile', icon: User, desc: 'Update your details' },
  { href: '/dashboard', label: 'Dashboard', icon: Home, desc: 'Leadership overview' },
]

export default function HelpPanel({ open, onClose, onOpenSearch }: HelpPanelProps) {
  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-50 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface rounded-xl border border-border shadow-overlay animate-page-enter overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">Help & support</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Quick actions
            </p>
            <ul className="space-y-1">
              {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
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
                      <p className="text-sm font-medium text-text-primary">Search the system</p>
                      <p className="text-xs text-text-muted">Members, services, choirs, and more</p>
                    </div>
                  </button>
                </li>
              )}
            </ul>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
              Tips
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <Keyboard size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>Press <kbd className="font-mono text-xs bg-surface-overlay px-1 rounded border border-border">Ctrl+K</kbd> or <kbd className="font-mono text-xs bg-surface-overlay px-1 rounded border border-border">⌘K</kbd> to open search from anywhere.</span>
              </li>
              <li className="flex items-start gap-2">
                <Menu size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>On mobile, tap the menu icon (top left) to open navigation.</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>Check the bell icon for announcements and reminders.</span>
              </li>
              <li className="flex items-start gap-2">
                <Smartphone size={15} className="text-text-muted shrink-0 mt-0.5" />
                <span>For account or access issues, contact your church administrator or choir/protocol leader.</span>
              </li>
            </ul>
          </section>

          <p className={cn('text-xs text-text-muted border-t border-border pt-3')}>
            CMMS Church Management System — pilot edition. More guided help is coming soon.
          </p>
        </div>
      </div>
    </>
  )
}
