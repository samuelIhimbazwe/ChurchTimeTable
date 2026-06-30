'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTourStore } from '@/stores/tour'
import { stepsForPersona } from '@/lib/tour/steps'
import { tourUi, getStepCopy } from '@/lib/tour/tour-ui'
import { useUIStore } from '@/stores'
import { isAppLocale } from '@/lib/i18n/auth-ui'
import type { TourPersona } from '@/lib/tour/types'

const PADDING = 8
const TOOLTIP_GAP = 12

type Rect = { top: number; left: number; width: number; height: number }

function measureTarget(selector: string): Rect | null {
  const nodes = document.querySelectorAll(`[data-tour="${selector}"]`)
  for (const el of nodes) {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  }
  return null
}

function tooltipPosition(
  rect: Rect,
  tooltipW: number,
  tooltipH: number,
): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let top = rect.top + rect.height + TOOLTIP_GAP
  let left = rect.left + rect.width / 2 - tooltipW / 2

  if (top + tooltipH > vh - 16) {
    top = rect.top - tooltipH - TOOLTIP_GAP
  }
  if (top < 16) top = 16
  if (left < 16) left = 16
  if (left + tooltipW > vw - 16) left = vw - tooltipW - 16

  return { top, left }
}

type Props = {
  persona: TourPersona
  onComplete: () => void
  onSkip: () => void
}

export function GuidedTour({ persona, onComplete, onSkip }: Props) {
  const stepIndex = useTourStore((s) => s.stepIndex)
  const nextStep = useTourStore((s) => s.nextStep)
  const prevStep = useTourStore((s) => s.prevStep)
  const endTour = useTourStore((s) => s.endTour)

  const storedLocale = useUIStore((s) => s.locale)
  const locale = isAppLocale(storedLocale) ? storedLocale : 'en'
  const strings = tourUi[locale]

  const steps = stepsForPersona(persona)
  const current = steps[stepIndex]
  const copy = current
    ? getStepCopy(strings, current.id, persona)
    : { title: '', body: '' }

  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)
  const [tooltipSize, setTooltipSize] = useState({ w: 320, h: 200 })

  const refresh = useCallback(() => {
    if (!current) return
    setRect(measureTarget(current.target))
  }, [current])

  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    refresh()
    const nodes = document.querySelectorAll(`[data-tour="${current.target}"]`)
    let scrolled = false
    for (const candidate of nodes) {
      const r = candidate.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      candidate.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      scrolled = true
      break
    }
    if (!scrolled) {
      nodes[0]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }

    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, true)
    return () => {
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh, true)
    }
  }, [current, refresh, stepIndex])

  if (!mounted || !current) return null

  const isLast = stepIndex >= steps.length - 1
  const stepLabel = strings.tourStepOf
    .replace('{current}', String(stepIndex + 1))
    .replace('{total}', String(steps.length))

  const tooltipPos = rect
    ? tooltipPosition(rect, tooltipSize.w, tooltipSize.h)
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 }

  const handleNext = () => {
    if (isLast) {
      endTour()
      onComplete()
    } else {
      nextStep(steps.length - 1)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left - PADDING}
                y={rect.top - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.55)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto"
          onClick={handleNext}
        />
      </svg>

      {rect && (
        <div
          className="absolute pointer-events-none rounded-lg ring-2 ring-gold-400 ring-offset-2 ring-offset-transparent"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      )}

      <div
        ref={(node) => {
          if (node) {
            const { offsetWidth, offsetHeight } = node
            if (
              offsetWidth !== tooltipSize.w
              || offsetHeight !== tooltipSize.h
            ) {
              setTooltipSize({ w: offsetWidth, h: offsetHeight })
            }
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        className={cn(
          'absolute z-[101] w-[min(360px,calc(100vw-2rem))]',
          'bg-surface border border-border rounded-xl shadow-overlay',
          'pointer-events-auto animate-page-enter',
        )}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold-600 mb-1">
              {stepLabel}
            </p>
            <h2 id="tour-step-title" className="text-base font-semibold text-text-primary">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { endTour(); onSkip() }}
            className="p-1 rounded text-text-muted hover:text-text-primary shrink-0"
            aria-label={strings.endTour}
          >
            <X size={16} />
          </button>
        </div>

        <p className="px-4 pb-3 text-sm text-text-secondary leading-relaxed">
          {!rect ? strings.targetMissing : copy.body}
        </p>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border bg-surface-raised/50 rounded-b-xl">
          <button
            type="button"
            onClick={() => { endTour(); onSkip() }}
            className="text-xs font-medium text-text-muted hover:text-text-primary"
          >
            {strings.endTour}
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg hover:bg-surface-raised"
              >
                {strings.back}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1.5 text-xs font-semibold bg-gold-500 text-primary-900 rounded-lg hover:bg-gold-400"
            >
              {isLast ? strings.finish : strings.next}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
