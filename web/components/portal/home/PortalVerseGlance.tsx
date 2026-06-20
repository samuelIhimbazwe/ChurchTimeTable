'use client'

import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { Card } from '@/components/shared'
import { useTranslations } from '@/lib/i18n'
import type { DevotionItem } from '@/lib/api/modules/memberPortal'

type Props = {
  verse: DevotionItem | null
}

export function PortalVerseGlance({ verse }: Props) {
  const { tr } = useTranslations()

  return (
    <Card accent="info" padding="md" className="h-full bg-surface/80 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <BookOpen size={20} className="text-info shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-info">
            {tr('Scripture')}
          </p>
          {verse ? (
            <>
              <p className="text-sm text-text-primary mt-2 leading-relaxed line-clamp-3">
                {verse.verseText ?? verse.content ?? verse.title}
              </p>
              {verse.verseReference && (
                <p className="text-xs text-text-muted mt-2 font-medium">
                  — {verse.verseReference}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-text-muted mt-2">
              {tr('Verse of the day will appear here.')}
            </p>
          )}
          <Link
            href="/portal/devotion"
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            {tr('Devotion center')} <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </Card>
  )
}
