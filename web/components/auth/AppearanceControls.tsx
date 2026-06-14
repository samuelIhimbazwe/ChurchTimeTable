'use client'

import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/index'
import { APP_LOCALES, LOCALE_SHORT, type AppLocale } from '@/lib/i18n/auth-ui'

interface AppearanceControlsProps {
  className?: string
  compact?: boolean
}

export function AppearanceControls({ className, compact = false }: AppearanceControlsProps) {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const locale = useUIStore((s) => s.locale)
  const setLocale = useUIStore((s) => s.setLocale)

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 p-1 rounded-lg border border-border bg-surface shadow-sm',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
      >
        {theme === 'dark' ? <Sun size={compact ? 16 : 18} /> : <Moon size={compact ? 16 : 18} />}
      </button>

      <div className="h-5 w-px bg-border shrink-0" aria-hidden />

      <div className="flex items-center gap-0.5 pr-0.5">
        {APP_LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as AppLocale)}
            aria-label={`Language ${LOCALE_SHORT[code]}`}
            aria-pressed={locale === code}
            className={cn(
              'min-w-[2rem] px-1.5 py-1 rounded-md text-xs font-semibold transition-colors',
              locale === code
                ? 'bg-primary-100 text-primary-800'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-raised',
            )}
          >
            {LOCALE_SHORT[code]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AuthAppearanceBar() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <AppearanceControls />
    </div>
  )
}
