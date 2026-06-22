import { Mic2 } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/voice-ui-capability-registry'
import { voiceRouteTailFromPath } from '../choir/voice-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  'voice-sections': 'voice-sections-hub',
}

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function voiceNavGateForPath(path: string): string | null {
  const tail = voiceRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForVoiceRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = voiceNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function voiceNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForVoiceRoute(path, auth)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = voiceNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyVoiceNavOverrides(
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

export function augmentVoiceNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const extras: NavItem[] = []
  const voicePath = choirPath(choirId, 'voice-sections')

  if (
    !pathInSections(sections, voicePath)
    && pageAccessForVoiceRoute(voicePath, auth)
  ) {
    extras.push({ label: 'Voice sections', path: voicePath, icon: Mic2 })
  }

  if (extras.length === 0) return sections

  const idx = sections.findIndex((s) => s.section === 'Music')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, ...extras] } : sec,
    )
  }
  return [...sections, { section: 'Music', items: extras }]
}

export function composeVoiceAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyVoiceNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentVoiceNavSections(withOverrides, choirId, auth)
}
