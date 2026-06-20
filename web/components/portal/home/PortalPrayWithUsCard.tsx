'use client'

import Link from 'next/link'
import { HeartHandshake } from 'lucide-react'
import { Card } from '@/components/shared'
import { PrayerRequestForm } from '@/components/portal/PrayerRequestForm'
import { useTranslations } from '@/lib/i18n'
import type { TwoDayPrayer } from '@/lib/api/modules/memberPortal'

type Props = {
  prayers: TwoDayPrayer[]
  showPrayerForm: boolean
  onOpenPrayerForm: () => void
  onClosePrayerForm: () => void
  compact?: boolean
}

export function PortalPrayWithUsCard({
  prayers,
  showPrayerForm,
  onOpenPrayerForm,
  onClosePrayerForm,
  compact = false,
}: Props) {
  const { tr } = useTranslations()

  return (
    <Card accent="gold" padding="md">
      <div className="flex items-start gap-3">
        <HeartHandshake size={20} className="text-gold-700 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            {tr('Pray with us')}
          </p>
          <div className="mt-2 space-y-2">
            {prayers.slice(0, compact ? 1 : 2).map((p) => (
              <div key={p.id}>
                <p className="text-xs font-semibold text-gold-800">{p.dayLabel}</p>
                <p className="text-sm text-text-primary line-clamp-2">{p.content}</p>
              </div>
            ))}
            {prayers.length === 0 && (
              <p className="text-sm text-text-muted">{tr('Two-day prayer guide coming soon.')}</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/portal/devotion"
              className="text-xs font-semibold text-primary-600 hover:text-primary-800"
            >
              {tr('More devotion')}
            </Link>
            {!showPrayerForm && (
              <button
                type="button"
                onClick={onOpenPrayerForm}
                className="text-xs font-semibold text-primary-600 hover:text-primary-800"
              >
                {tr('Prayer request')}
              </button>
            )}
          </div>
        </div>
      </div>
      {showPrayerForm && (
        <div className="mt-4 pt-4 border-t border-border">
          <PrayerRequestForm
            compact
            initialOpen
            onSuccess={onClosePrayerForm}
          />
        </div>
      )}
    </Card>
  )
}
