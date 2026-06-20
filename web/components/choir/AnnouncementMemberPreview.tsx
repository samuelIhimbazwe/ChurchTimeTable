'use client'

import { Card } from '@/components/shared'
import { Eye } from 'lucide-react'

type Props = {
  title: string
  body: string
  audienceLabel: string
}

export function AnnouncementMemberPreview({ title, body, audienceLabel }: Props) {
  if (!title.trim() && !body.trim()) return null

  return (
    <Card padding="md" className="bg-surface-raised border-dashed">
      <div className="flex items-center gap-2 mb-3">
        <Eye size={14} className="text-text-muted" />
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Member preview
        </p>
        <span className="text-[10px] text-text-muted ml-auto">{audienceLabel}</span>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
        <p className="font-semibold text-text-primary">{title.trim() || 'Announcement title'}</p>
        <p className="text-sm text-text-secondary whitespace-pre-wrap">
          {body.trim() || 'Your message will appear here.'}
        </p>
        <p className="text-[10px] text-text-muted pt-2 border-t border-border">
          As members see it in the choir inbox
        </p>
      </div>
    </Card>
  )
}
