import { FileText, Package } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/logistics-ui-capability-registry'
import { logisticsRouteTailFromPath } from '../choir/logistics-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  documents: 'logistics-documents-hub',
  assets: 'logistics-assets-hub',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function logisticsNavGateForPath(path: string): string | null {
  const tail = logisticsRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForLogisticsRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = logisticsNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function logisticsNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForLogisticsRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = logisticsNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyLogisticsNavOverrides(
  sections: NavSection[],
  auth: ResolvedAuth | undefined,
): NavSection[] {
  return sections
    .map((sec) => ({
      ...sec,
      items: filterItems(sec.items, auth),
    }))
    .filter((sec) => sec.items.length > 0)
}

function pathInSections(sections: NavSection[], path: string): boolean {
  return sections.some((sec) => sec.items.some((item) => item.path === path))
}

export function augmentLogisticsNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const extras: NavItem[] = []
  const documentsPath = choirPath(choirId, 'documents')
  const assetsPath = choirPath(choirId, 'assets')

  if (
    !pathInSections(sections, documentsPath)
    && pageAccessForLogisticsRoute(documentsPath, auth)
  ) {
    extras.push({ label: 'Documents', path: documentsPath, icon: FileText })
  }
  if (
    !pathInSections(sections, assetsPath)
    && pageAccessForLogisticsRoute(assetsPath, auth)
  ) {
    extras.push({ label: 'Assets', path: assetsPath, icon: Package })
  }

  if (extras.length === 0) return sections

  const idx = sections.findIndex((s) => s.section === 'Administration')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, ...extras] } : sec,
    )
  }
  return [...sections, { section: 'Logistics', items: extras }]
}

export function composeLogisticsAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyLogisticsNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentLogisticsNavSections(withOverrides, choirId, auth)
}
