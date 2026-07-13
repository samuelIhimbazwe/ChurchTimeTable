'use client'

import { useQuery } from '@tanstack/react-query'
import { KeyRound, Settings2, UserPlus, FileText, Shield } from 'lucide-react'
import { choirApi } from '@/lib/api'
import { Card, SkeletonCard } from '@/components/shared'
import { HubQuickLink } from '@/components/choir/ChoirPositionHubShell'
import { useResolvedChoirScope } from '@/lib/hooks'
import { memberOnboardingHref } from '@/lib/choir/membership-intake'

function ruleLines(rules: Record<string, unknown> | undefined): string[] {
  if (!rules) return []
  const lines: string[] = []
  if (typeof rules.primaryChoirLimit === 'number') {
    lines.push(`Primary choir limit: ${rules.primaryChoirLimit} per member`)
  }
  if (rules.yerusalemuException === true) {
    lines.push('Yerusalemu may be held alongside a primary choir membership')
  }
  if (Array.isArray(rules.hiddenChoirCodes)) {
    lines.push(`Hidden choirs (portal): ${(rules.hiddenChoirCodes as string[]).join(', ')}`)
  }
  if (typeof rules.summary === 'string') {
    lines.push(rules.summary)
  }
  return lines
}

export function ChoirSettingsPanel() {
  const { choirId, choirLink, choirName } = useResolvedChoirScope()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['choir-membership-rules'],
    queryFn: () => choirApi.getMembershipRules(),
  })

  const ruleList = ruleLines(rules as Record<string, unknown> | undefined)

  if (!choirId) {
    return (
      <Card padding="md">
        <p className="text-center text-text-muted py-12 text-sm">
          Open settings from your choir dashboard.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-text-primary">Choir-wide settings</h2>
        <p className="text-text-secondary text-sm mt-1">
          Configuration for {choirName ?? 'this choir'} — roles, profile, and membership policy.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <HubQuickLink
          href={choirLink('roles')}
          label="Position roles"
          desc="Create and edit officer permission bundles"
          icon={KeyRound}
        />
        <HubQuickLink
          href={choirLink('public-profile')}
          label="Public profile"
          desc="Portal summary, featured release, member count visibility"
          icon={Settings2}
        />
        <HubQuickLink
          href={memberOnboardingHref(choirLink)}
          label="Member onboarding"
          desc="Provision singers and assign positions"
          icon={UserPlus}
        />
        <HubQuickLink
          href={choirLink('announcements')}
          label="Announcements"
          desc="Targeted choir communications"
          icon={FileText}
        />
        <HubQuickLink
          href={choirLink('admin')}
          label="Administration hub"
          desc="Roster, families structure, service prep"
          icon={Shield}
        />
      </div>

      <Card padding="md">
        <p className="font-semibold text-text-primary flex items-center gap-2 mb-3">
          <Shield size={18} /> Membership rules
        </p>
        {isLoading ? (
          <SkeletonCard rows={3} />
        ) : ruleList.length === 0 ? (
          <p className="text-sm text-text-muted">
            Membership rules are enforced by the system. Members may hold one primary choir;
            secondary memberships follow church policy.
          </p>
        ) : (
          <ul className="space-y-2">
            {ruleList.map((line) => (
              <li key={line} className="text-sm text-text-secondary flex gap-2">
                <span className="text-primary-500">•</span>
                {line}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-text-muted mt-4">
          Choir dissolution transfers are managed by choir administrators from service operations.
        </p>
      </Card>
    </div>
  )
}
