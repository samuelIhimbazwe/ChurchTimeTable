'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { X, Settings, Sun, Moon, PanelLeft, User, Languages, Contrast, Type, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore, type AppTheme, type FontScale, type ReducedMotionPref, useAuthStore, EMPTY_PERMISSIONS } from '@/stores/index'
import { useSetAppLocale, useTranslations, APP_LOCALES, LOCALE_NAMES, type AppLocale } from '@/lib/i18n'
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'
import { useViewAsStore } from '@/lib/governance/view-as-store'
import { canUseMemberPreview } from '@/lib/governance/permissions-preview'
import { accountProfilePath } from '@/lib/account/paths'
import { useDualMemberPortalAccess } from '@/lib/portal/access'

interface PreferencesPanelProps {
  open:    boolean
  onClose: () => void
}

const FONT_SCALES: Array<{ id: FontScale; label: string }> = [
  { id: 'small', label: 'Small' },
  { id: 'default', label: 'Default' },
  { id: 'large', label: 'Large' },
  { id: 'xlarge', label: 'Extra large' },
]

const MOTION_PREFS: Array<{ id: ReducedMotionPref; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'reduce', label: 'Reduce motion' },
  { id: 'no-preference', label: 'Allow motion' },
]

export default function PreferencesPanel({ open, onClose }: PreferencesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const locale = useUIStore((s) => s.locale)
  const fontScale = useUIStore((s) => s.fontScale)
  const setFontScale = useUIStore((s) => s.setFontScale)
  const reducedMotion = useUIStore((s) => s.reducedMotion)
  const setReducedMotion = useUIStore((s) => s.setReducedMotion)
  const setAppLocale = useSetAppLocale()
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const viewAsMember = useViewAsStore((s) => s.viewAsMember)
  const setViewAsMember = useViewAsStore((s) => s.setViewAsMember)
  const permissions = useAuthStore((s) => s.user?.permissions ?? EMPTY_PERMISSIONS)
  const showMemberPreview = canUseMemberPreview(permissions)
  const { tr } = useTranslations()
  const { isDualMember } = useDualMemberPortalAccess()
  const profileHref = accountProfilePath(isDualMember)

  if (!open) return null

  const themes: Array<{ id: AppTheme; label: string; icon: React.ElementType }> = [
    { id: 'light', label: tr('Light'), icon: Sun },
    { id: 'dark', label: tr('Dark'), icon: Moon },
    { id: 'high-contrast', label: tr('High contrast'), icon: Contrast },
  ]

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={tr('Preferences')}
        className="fixed top-below-topbar left-3 right-3 sm:left-auto sm:right-4 z-50 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface rounded-md border border-border shadow-overlay overflow-hidden max-h-below-topbar"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">{tr('Preferences')}</span>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label={tr('Close')}>
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-5">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              {tr('Appearance')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors',
                    theme === id
                      ? 'border-primary-500 bg-surface-raised text-text-primary'
                      : 'border-border text-text-secondary hover:bg-surface-raised',
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-1.5">
              <Type size={14} />
              {tr('Text size')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FONT_SCALES.map((scale) => (
                <button
                  key={scale.id}
                  type="button"
                  onClick={() => setFontScale(scale.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                    fontScale === scale.id
                      ? 'border-primary-500 bg-surface-raised text-text-primary'
                      : 'border-border text-text-secondary hover:bg-surface-raised',
                  )}
                >
                  {tr(scale.label)}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              {tr('Motion')}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {MOTION_PREFS.map((pref) => (
                <button
                  key={pref.id}
                  type="button"
                  onClick={() => setReducedMotion(pref.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium text-left transition-colors',
                    reducedMotion === pref.id
                      ? 'border-primary-500 bg-surface-raised text-text-primary'
                      : 'border-border text-text-secondary hover:bg-surface-raised',
                  )}
                >
                  {tr(pref.label)}
                </button>
              ))}
            </div>
          </section>

          {showMemberPreview && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-1.5">
                <Eye size={14} />
                {tr('Officer tools')}
              </p>
              <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-raised transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{tr('View as member')}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {tr('Preview what members see — hides manage actions')}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={viewAsMember}
                  onChange={(e) => setViewAsMember(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary-600 focus:ring-gold-500"
                />
              </label>
            </section>
          )}

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              {tr('Language')}
            </p>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
              {APP_LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setAppLocale(code as AppLocale)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-xs font-medium transition-colors',
                    locale === code
                      ? 'border-primary-500 bg-surface-raised text-text-primary'
                      : 'border-border text-text-secondary hover:bg-surface-raised',
                  )}
                >
                  <Languages size={14} className="shrink-0" />
                  {LOCALE_NAMES[code]}
                </button>
              ))}
            </div>
          </section>

          <section className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              {tr('Navigation')}
            </p>
            <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-surface-raised transition-colors">
              <span className="flex items-center gap-2 text-sm text-text-primary">
                <PanelLeft size={16} className="text-text-muted" />
                {tr('Collapsed sidebar')}
              </span>
              <input
                type="checkbox"
                checked={sidebarCollapsed}
                onChange={toggleSidebar}
                className="w-4 h-4 rounded border-border text-primary-600 focus:ring-gold-500"
              />
            </label>
            <p className="text-xs text-text-muted mt-2 px-1">
              {tr('On desktop, use a narrow icon-only sidebar. Saved on this device.')}
            </p>
          </section>

          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
              {tr('Account')}
            </p>
            <Link
              href={profileHref}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border hover:bg-surface-raised transition-colors"
            >
              <User size={16} className="text-primary-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-primary">{tr('Edit profile')}</p>
                <p className="text-xs text-text-muted">{tr('Name, email, phone, and photo')}</p>
              </div>
            </Link>
          </section>
        </div>
      </div>
    </>
  )
}
