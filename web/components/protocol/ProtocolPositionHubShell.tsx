'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/shared'

const ROLE_LABELS: Record<string, { title: string; summary: string }> = {
  protocol_president: {
    title: 'Protocol President',
    summary: 'Oversight, coordination with church leadership, and operational monitoring.',
  },
  protocol_coordinator: {
    title: 'Protocol Coordinator',
    summary: 'Team scheduling, assignments, and day-to-day service coordination.',
  },
  protocol_treasurer: {
    title: 'Protocol Treasurer',
    summary: 'Finance tracking, approvals, and stewardship for protocol activities.',
  },
  protocol_secretary: {
    title: 'Protocol Secretary',
    summary: 'Records, events, and operational reporting.',
  },
  protocol_team_head: {
    title: 'Team Head',
    summary: 'Lead your assigned service team and mark attendance.',
  },
}

type ShellProps = {
  roleKey: string
  title?: string
  subtitle?: string
  children: React.ReactNode
}

export function ProtocolPositionHubShell({
  roleKey,
  title,
  subtitle,
  children,
}: ShellProps) {
  const meta = ROLE_LABELS[roleKey]
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <div>
        <h1 className="font-display text-3xl text-text-primary">
          {title ?? meta?.title ?? roleKey.replace(/^protocol_/, '').replace(/_/g, ' ')}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {subtitle ?? meta?.summary}
        </p>
      </div>
      {children}
    </div>
  )
}

type QuickLinkProps = {
  href: string
  label: string
  desc: string
  icon: React.ElementType
  stat?: string | number
}

export function ProtocolHubQuickLink({ href, label, desc, icon: Icon, stat }: QuickLinkProps) {
  return (
    <Link href={href}>
      <Card padding="md" className="h-full hover:shadow-raised transition-shadow group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-100/60 flex items-center justify-center shrink-0">
              <Icon size={18} className="text-primary-600 dark:text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-text-primary group-hover:text-primary-700 dark:group-hover:text-gold-400">{label}</p>
              <p className="text-xs text-text-muted mt-1">{desc}</p>
              {stat != null && (
                <p className="text-xs font-semibold text-primary-600 mt-2">{stat}</p>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-text-muted group-hover:text-primary-600 dark:group-hover:text-gold-400 shrink-0 mt-1" />
        </div>
      </Card>
    </Link>
  )
}
