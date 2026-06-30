'use client'

import { Sparkles } from 'lucide-react'
import { tourUi } from '@/lib/tour/tour-ui'
import { tourPersonaLabel } from '@/lib/tour/personas'
import { useUIStore } from '@/stores'
import { isAppLocale } from '@/lib/i18n/auth-ui'
import type { TourPersona } from '@/lib/tour/types'

type Props = {
  open: boolean
  persona: TourPersona
  userName?: string
  onStart: () => void
  onDefer: () => void
  onSkip: () => void
}

export function WelcomeTourModal({
  open,
  persona,
  userName,
  onStart,
  onDefer,
  onSkip,
}: Props) {
  const storedLocale = useUIStore((s) => s.locale)
  const locale = isAppLocale(storedLocale) ? storedLocale : 'en'
  const strings = tourUi[locale]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary-950/40 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-tour-title"
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-overlay p-6 animate-page-enter"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center">
            <Sparkles size={20} className="text-gold-700" />
          </div>
          <div>
            <h2 id="welcome-tour-title" className="text-lg font-semibold text-text-primary">
              {userName
                ? `${strings.welcomeTitle}, ${userName.split(' ')[0]}`
                : strings.welcomeTitle}
            </h2>
            <p className="text-xs text-text-muted">
              {strings.welcomePersonaHint} {tourPersonaLabel(persona)}
            </p>
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed mb-6">
          {strings.welcomeBody}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onStart}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400"
          >
            {strings.startTour}
          </button>
          <button
            type="button"
            onClick={onDefer}
            className="flex-1 px-4 py-2.5 text-sm font-semibold border border-border rounded-lg hover:bg-surface-raised"
          >
            {strings.remindLater}
          </button>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="w-full mt-2 py-2 text-xs font-medium text-text-muted hover:text-text-primary"
        >
          {strings.skipTour}
        </button>
      </div>
    </div>
  )
}
