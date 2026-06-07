'use client'

import Link from 'next/link'
import { X, Settings, Sun, Moon, PanelLeft, User } from 'lucide-react'
import { useUIStore } from '@/stores/index'
import { cn } from '@/lib/utils'

interface PreferencesPanelProps {
  open:    boolean
  onClose: () => void
}

export default function PreferencesPanel({ open, onClose }: PreferencesPanelProps) {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 z-50 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface rounded-xl border border-border shadow-overlay animate-page-enter overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">Preferences</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              Appearance
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  theme === 'light'
                    ? 'border-gold-500 bg-gold-50 text-text-primary'
                    : 'border-border text-text-secondary hover:bg-surface-raised',
                )}
              >
                <Sun size={16} /> Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
                  theme === 'dark'
                    ? 'border-gold-500 bg-gold-50 text-text-primary'
                    : 'border-border text-text-secondary hover:bg-surface-raised',
                )}
              >
                <Moon size={16} /> Dark
              </button>
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              Navigation
            </p>
            <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-raised transition-colors">
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <PanelLeft size={16} className="text-text-muted" />
                Collapsed sidebar
              </span>
              <input
                type="checkbox"
                checked={sidebarCollapsed}
                onChange={toggleSidebar}
                className="w-4 h-4 rounded border-border text-primary-600 focus:ring-gold-500"
              />
            </label>
            <p className="text-xs text-text-muted mt-2 px-1">
              On desktop, use a narrow icon-only sidebar. Saved on this device.
            </p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              Account
            </p>
            <Link
              href="/portal/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors"
            >
              <User size={16} className="text-primary-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary">Edit profile</p>
                <p className="text-xs text-text-muted">Name, email, phone, and photo</p>
              </div>
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
