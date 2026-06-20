'use client'

import { Card } from '@/components/shared'
import { Lock } from 'lucide-react'

type Props = {
  className?: string
}

export function WelfarePrivacyNotice({ className }: Props) {
  return (
    <Card padding="md" accent="info" className={className}>
      <div className="flex items-start gap-3">
        <Lock size={18} className="text-info shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm text-text-secondary">
          <p className="font-semibold text-text-primary">Your privacy</p>
          <p>
            Welfare cases are visible only to you and authorized care officers. Notes are
            masked on shared screens until an officer explicitly reveals them.
          </p>
          <p className="text-xs text-text-muted">
            Access by church staff is logged for accountability. Contact your family head or
            welfare officer if you have questions about who can see your case.
          </p>
        </div>
      </div>
    </Card>
  )
}
