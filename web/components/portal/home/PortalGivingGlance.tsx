'use client'

import Link from 'next/link'
import { ChevronRight, DollarSign } from 'lucide-react'
import { Card } from '@/components/shared'
import { useTranslations } from '@/lib/i18n'

export function PortalGivingGlance() {
  const { tr } = useTranslations()

  return (
    <Card padding="md" className="h-full bg-surface/80 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700 flex items-center gap-1.5">
        <DollarSign size={14} />
        {tr('Giving')}
      </p>
      <p className="text-sm text-text-secondary mt-2">
        {tr('Track choir contributions, family goals, and payment history.')}
      </p>
      <Link
        href="/portal/contributions"
        className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-primary-600 hover:text-primary-800"
      >
        {tr('Open contributions')}
        <ChevronRight size={14} />
      </Link>
    </Card>
  )
}
