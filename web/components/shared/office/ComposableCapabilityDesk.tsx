'use client'

import Link from 'next/link'
import {
  Calendar, Shield, DollarSign, FileText, Heart, BookOpen, Users, Music,
  BarChart3, Settings2, UserPlus, Megaphone, Scale, KeyRound, ClipboardCheck,
} from 'lucide-react'
import { Card } from '@/components/shared'
import { HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import type { ResolvedChoirCapability } from '@/lib/choir/capability-registry'

const CAPABILITY_ICONS: Record<string, React.ElementType> = {
  operations: Calendar,
  'join-decisions': UserPlus,
  finance: DollarSign,
  'treasury-verify': ClipboardCheck,
  reports: BarChart3,
  discipline: Shield,
  'care-desk': Heart,
  spiritual: BookOpen,
  music: Music,
  families: Users,
  records: FileText,
  announcements: Megaphone,
  roles: KeyRound,
  'public-profile': Settings2,
  executive: Scale,
}

type Props = {
  capabilities: ResolvedChoirCapability[]
  customRoleLabels?: string[]
  totalRegistryCount?: number
  intro?: string
  emptyHref?: string
  emptyMessage?: string
}

export function ComposableCapabilityDesk({
  capabilities,
  customRoleLabels = [],
  totalRegistryCount,
  intro,
  emptyHref,
  emptyMessage,
}: Props) {
  const registryTotal = totalRegistryCount ?? capabilities.length

  return (
    <div className="space-y-4">
      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          {intro ??
            'Your desk is built from assigned permissions — only entitled tools appear here.'}
        </p>
        {customRoleLabels.length > 0 && (
          <p className="text-xs text-text-muted mt-2">
            Assigned profile{customRoleLabels.length > 1 ? 's' : ''}:{' '}
            <strong className="text-text-primary">{customRoleLabels.join(', ')}</strong>
          </p>
        )}
        <p className="text-xs text-text-muted mt-2">
          {capabilities.length} of {registryTotal} capability areas active
        </p>
      </Card>

      {capabilities.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-6">
            {emptyMessage ?? 'No tools assigned yet.'}
            {emptyHref && (
              <>
                {' '}
                <Link href={emptyHref} className="text-primary-600 font-semibold">
                  Position roles →
                </Link>
              </>
            )}
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {capabilities.map((cap) => (
            <HubQuickLink
              key={cap.id}
              href={cap.href}
              label={cap.label}
              desc={cap.desc}
              icon={CAPABILITY_ICONS[cap.id] ?? FileText}
            />
          ))}
        </div>
      )}
    </div>
  )
}
