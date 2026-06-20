'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/lib/i18n'
import {
  resolveBackTarget,
  shouldShowBackButton,
  type BackTarget,
} from '@/lib/navigation/back-target'

type Variant = 'icon' | 'compact' | 'text'

type Props = {
  className?: string
  variant?: Variant
  /** Override smart fallback destination */
  href?: string
  label?: string
  /** Force show even on hub routes */
  forceShow?: boolean
}

export function BackButton({
  className,
  variant = 'compact',
  href,
  label,
  forceShow = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { tr } = useTranslations()

  const visible = forceShow || shouldShowBackButton(pathname)

  const fallback: BackTarget = {
    href: href ?? resolveBackTarget(pathname).href,
    label: label ?? resolveBackTarget(pathname).label,
  }

  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(fallback.href)
  }, [router, fallback.href])

  if (!visible) return null

  const ariaLabel = `${tr('Back')} — ${fallback.label}`

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={goBack}
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-center p-2 -ml-1 rounded-md',
          'text-text-muted hover:text-text-primary hover:bg-surface-raised',
          'transition-colors shrink-0 touch-target',
          className,
        )}
      >
        <ArrowLeft size={20} />
      </button>
    )
  }

  if (variant === 'text') {
    return (
      <Link
        href={fallback.href}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-semibold',
          'text-primary-700 hover:text-primary-900 transition-colors',
          className,
        )}
      >
        <ArrowLeft size={14} />
        {tr('Back')}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-semibold',
        'text-text-secondary hover:text-text-primary transition-colors',
        className,
      )}
    >
      <ArrowLeft size={16} aria-hidden />
      <span>{tr('Back')}</span>
      <span className="text-text-muted font-normal hidden sm:inline">
        · {fallback.label}
      </span>
    </button>
  )
}
