import type { ChoirDashboardContext } from '@/lib/choir/dashboard-context'
import {
  FAMILY_OFFICES,
  familyOfficePath,
  resolveFamilyOfficeKindFromRole,
} from '@/lib/choir/family-office'
import { committeeHubPath } from '@/lib/choir/officer-roles'

export type MemberLeadershipOffice = {
  id: string
  label: string
  href: string
  subtitle?: string
  group: 'choir' | 'family'
}

type FamilyContextFamily = {
  role: string
  familyName?: string | null
}

export function resolveMemberLeadershipOffices(
  choirId: string,
  context: ChoirDashboardContext | undefined,
  familyFallback?: FamilyContextFamily[],
): MemberLeadershipOffice[] {
  const seen = new Set<string>()
  const offices: MemberLeadershipOffice[] = []

  for (const position of context?.positions ?? []) {
    const href = committeeHubPath(choirId, position.roleKey)
    if (!href || seen.has(href)) continue
    seen.add(href)
    offices.push({
      id: `choir-${position.roleKey}`,
      label: position.roleName,
      href,
      subtitle: 'Choir leadership desk',
      group: 'choir',
    })
  }

  const familyRows = context?.familyOffices?.length
    ? context.familyOffices.map((row) => ({
        role: row.role,
        familyName: row.familyName,
        href: row.officePath,
        label: row.label,
      }))
    : (familyFallback ?? [])
        .map((row) => {
          const kind = resolveFamilyOfficeKindFromRole(row.role)
          if (!kind) return null
          return {
            role: row.role,
            familyName: row.familyName ?? undefined,
            href: familyOfficePath(choirId, kind),
            label: FAMILY_OFFICES[kind].officeTitle,
          }
        })
        .filter(Boolean) as Array<{
        role: string
        familyName?: string
        href: string
        label: string
      }>

  for (const row of familyRows) {
    if (seen.has(row.href)) continue
    seen.add(row.href)
    offices.push({
      id: `family-${row.role}-${row.href}`,
      label: row.label,
      href: row.href,
      subtitle: row.familyName ? `${row.familyName} family` : 'Family leadership desk',
      group: 'family',
    })
  }

  return offices
}

export function hasMemberLeadershipOffice(
  choirId: string,
  context: ChoirDashboardContext | undefined,
  familyFallback?: FamilyContextFamily[],
): boolean {
  return resolveMemberLeadershipOffices(choirId, context, familyFallback).length > 0
}
