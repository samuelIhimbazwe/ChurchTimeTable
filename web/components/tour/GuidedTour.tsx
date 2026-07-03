'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTourStore } from '@/stores/tour'
import { stepsForPersona } from '@/lib/tour/steps'
import { tourUi, getStepCopy } from '@/lib/tour/tour-ui'
import { useUIStore } from '@/stores'
import { isAppLocale } from '@/lib/i18n/auth-ui'
import { markTourProgrammaticNav } from '@/lib/tour/navigation'
import type { TourPersona } from '@/lib/tour/types'

const PADDING = 8
const TOOLTIP_GAP = 12
const TOOLTIP_W = 360
const TOOLTIP_H = 220

type Rect = { top: number; left: number; width: number; height: number }

function measureTarget(selector: string): Rect | null {
  const nodes = document.querySelectorAll(`[data-tour="${selector}"]`)
  for (const el of Array.from(nodes)) {
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

function rectsEqual(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b
  return (
    a.top === b.top
    && a.left === b.left
    && a.width === b.width
    && a.height === b.height
  )
}

type Props = {
  persona: TourPersona
  onComplete: () => void
  onSkip: () => void
}

export function GuidedTour({ persona, onComplete, onSkip }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const stepIndex = useTourStore((s) => s.stepIndex)
  const nextStep = useTourStore((s) => s.nextStep)
  const prevStep = useTourStore((s) => s.prevStep)
  const endTour = useTourStore((s) => s.endTour)

  const storedLocale = useUIStore((s) => s.locale)
  const locale = isAppLocale(storedLocale) ? storedLocale : 'en'
  const strings = tourUi[locale]

  const steps = stepsForPersona(persona)
  const current = steps[stepIndex]
  const targetSelector = current?.target ?? ''
  const copy = current
    ? getStepCopy(strings, current.id, persona)
    : { title: '', body: '' }

  const [rect, setRect] = useState<Rect | null>(null)
  const [mounted, setMounted] = useState(false)
  const [targetMissing, setTargetMissing] = useState(false)
  const rafRef = useRef<number>(0)
  const endedForMissingRef = useRef(false)

  const refresh = useCallback(() => {
    if (!targetSelector) return
    const next = measureTarget(targetSelector)
    setRect((prev) => (rectsEqual(prev, next) ? prev : next))
  }, [targetSelector])

  const scheduleRefresh = useCallback(() => {
    if (rafRef.current) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0
      refresh()
    })
  }, [refresh])

  useEffect(() => setMounted(true), [])

  useLayoutEffect(() => {
    if (!targetSelector) return

    const measured = measureTarget(targetSelector)
    setTargetMissing(!measured)
    refresh()
    if (!measured) return

    const nodes = document.querySelectorAll(`[data-tour="${targetSelector}"]`)
    for (const candidate of Array.from(nodes)) {
      const r = candidate.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      candidate.scrollIntoView({ block: 'nearest', behavior: 'auto' })
      break
    }

    window.addEventListener('resize', scheduleRefresh)
    window.addEventListener('scroll', scheduleRefresh, true)
    return () => {
      window.removeEventListener('resize', scheduleRefresh)
      window.removeEventListener('scroll', scheduleRefresh, true)
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }
  }, [targetSelector, refresh, scheduleRefresh, stepIndex])

  useEffect(() => {
    endedForMissingRef.current = false
  }, [stepIndex, targetSelector])

  useEffect(() => {
    if (!mounted || !targetMissing || endedForMissingRef.current) return
    endedForMissingRef.current = true
    endTour()
    onSkip()
  }, [mounted, targetMissing, endTour, onSkip])

  if (!mounted || !current || targetMissing) return null

  const isLast = stepIndex >= steps.length - 1
  const stepLabel = strings.tourStepOf
    .replace('{current}', String(stepIndex + 1))
    .replace('{total}', String(steps.length))

  const tooltipPos = rect
    ? tooltipPosition(rect, TOOLTIP_W, TOOLTIP_H)
    : { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 }

  const handleNext = () => {
    if (isLast) {
      endTour()
      onComplete()
      return
    }
    const nextIndex = stepIndex + 1
    const next = steps[nextIndex]
    if (next?.route && pathname !== next.route) {
      markTourProgrammaticNav()
      router.push(next.route)
    }
    nextStep(steps.length - 1)
  }

  const handleBackdropClick = () => {
    handleNext()
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
          onClick={handleBackdropClick}
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        className={cn(
          'absolute z-[101] w-[min(360px,calc(100vw-2rem))]',
          'bg-surface border border-border rounded-xl shadow-overlay',
          'pointer-events-auto',
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
