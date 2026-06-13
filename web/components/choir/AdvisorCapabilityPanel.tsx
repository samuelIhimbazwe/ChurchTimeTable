'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/index'
import { Card } from '@/components/shared'
import { HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { useResolvedChoirScope } from '@/lib/hooks'
import { useOptionalChoirDashboardCtx } from '@/components/choir/ChoirDashboardProvider'
import {
  Calendar, Shield, DollarSign, FileText, Heart, BookOpen, Users, Music,
  BarChart3, Settings2, UserPlus, Megaphone, Scale, KeyRound,
} from 'lucide-react'

/** Maps permissions → tools an advisor may use (assigned per person by choir leadership) */
const ADVISOR_CAPABILITY_LINKS: Array<{
  anyOf: string[]
  href: string
  label: string
  desc: string
  icon: React.ElementType
}> = [
  {
    anyOf: ['choir.operations.manage', 'choir.ops.manage', 'choir.ops.view', 'event:write', 'choir.events.manage'],
    href: '/choir/scheduling',
    label: 'Choir operations',
    desc: 'Scheduling, activities, and operational oversight',
    icon: Calendar,
  },
  {
    anyOf: ['choir.join.review', 'member:manage'],
    href: '/choir/president/decisions',
    label: 'Join requests & roster',
    desc: 'Membership growth and onboarding',
    icon: UserPlus,
  },
  {
    anyOf: ['choir.finance.view', 'choir.finance.manage', 'ministry.finance.view'],
    href: '/choir/finance',
    label: 'Finance & stewardship',
    desc: 'Budgets, umusanzu, and financial planning',
    icon: DollarSign,
  },
  {
    anyOf: ['choir.reports.view', 'report:export', 'choir.ops.report'],
    href: '/choir/reports',
    label: 'Reports & development',
    desc: 'Analytics for choir growth and improvement',
    icon: BarChart3,
  },
  {
    anyOf: ['discipline:read_all', 'discipline:manage', 'discipline.review'],
    href: '/choir/discipline',
    label: 'Discipline & order',
    desc: 'Review or manage discipline cases',
    icon: Shield,
  },
  {
    anyOf: ['choir.welfare.view', 'choir.welfare.manage'],
    href: '/choir/welfare',
    label: 'Welfare & care',
    desc: 'Member wellbeing and visits',
    icon: Heart,
  },
  {
    anyOf: ['choir.devotion.manage', 'choir.devotion.publish', 'choir.spiritual.program.manage'],
    href: '/choir/spiritual',
    label: 'Spiritual life',
    desc: 'Prayer, devotions, and holiness nurture',
    icon: BookOpen,
  },
  {
    anyOf: ['choir.music.manage', 'choir.music.view', 'choir.rehearsal.manage'],
    href: '/choir/music-direction',
    label: 'Music & rehearsals',
    desc: 'Musical direction and library',
    icon: Music,
  },
  {
    anyOf: ['choir.family.manage', 'choir.family.view', 'family:manage', 'family:view'],
    href: '/choir/family-coordinator',
    label: 'Families & teams',
    desc: 'Family structure and participation',
    icon: Users,
  },
  {
    anyOf: ['choir.records.view', 'choir.document.manage', 'audit:read'],
    href: '/choir/records',
    label: 'Records & uniqueness',
    desc: 'Documents, assets, and choir identity',
    icon: FileText,
  },
  {
    anyOf: ['choir.announcement.manage', 'choir.member.notify'],
    href: '/choir/announcements',
    label: 'Announcements',
    desc: 'Official choir communications',
    icon: Megaphone,
  },
  {
    anyOf: ['choir.custom_role.manage', 'committee.role.manage'],
    href: '/choir/roles',
    label: 'Roles & governance',
    desc: 'Position permissions and structure',
    icon: KeyRound,
  },
  {
    anyOf: ['member:manage', 'choir.oversight'],
    href: '/choir/public-profile',
    label: 'Public profile',
    desc: 'How the choir presents itself',
    icon: Settings2,
  },
  {
    anyOf: ['event:read', 'choir.reports.view'],
    href: '/choir/president',
    label: 'Leadership dashboard',
    desc: 'Executive overview (when granted)',
    icon: Scale,
  },
]

function scopeChoirHref(choirLink: (...segments: string[]) => string, href: string) {
  if (!href.startsWith('/choir/')) return href
  const segments = href.slice('/choir/'.length).split('/').filter(Boolean)
  return choirLink(...segments)
}

export function AdvisorCapabilityPanel() {
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission)
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])
  const { choirLink } = useResolvedChoirScope()
  const choirCtx = useOptionalChoirDashboardCtx()
  const customRoleLabels =
    choirCtx?.context?.customRoles?.map((r) => r.name).filter(Boolean) ?? []

  const visible = ADVISOR_CAPABILITY_LINKS.filter((link) => hasAnyPermission(link.anyOf))

  return (
    <div className="space-y-4">
      <Card padding="md" accent="info">
        <p className="text-sm text-text-secondary">
          Advisors receive <strong>custom permissions</strong> from choir leadership — operations,
          development, spiritual life, uniqueness, etc. This panel shows only the tools assigned to you
          ({visible.length} of {ADVISOR_CAPABILITY_LINKS.length} areas).
        </p>
        {customRoleLabels.length > 0 && (
          <p className="text-xs text-text-muted mt-2">
            Your assigned profile{customRoleLabels.length > 1 ? 's' : ''}:{' '}
            <strong className="text-text-primary">{customRoleLabels.join(', ')}</strong>
          </p>
        )}
        {permissions.length > 0 && (
          <p className="text-xs text-text-muted mt-2">
            Active permission codes: {permissions.slice(0, 8).join(', ')}
            {permissions.length > 8 ? ` +${permissions.length - 8} more` : ''}
          </p>
        )}
      </Card>

      {visible.length === 0 ? (
        <Card padding="md">
          <p className="text-sm text-text-muted text-center py-6">
            No advisor tools assigned yet. Ask the President to set your permissions on{' '}
            <Link href={choirLink('roles')} className="text-primary-600 font-semibold">Position roles</Link>.
          </p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {visible.map((link) => (
            <HubQuickLink
              key={link.href + link.label}
              href={scopeChoirHref(choirLink, link.href)}
              label={link.label}
              desc={link.desc}
              icon={link.icon}
            />
          ))}
        </div>
      )}
    </div>
  )
}
