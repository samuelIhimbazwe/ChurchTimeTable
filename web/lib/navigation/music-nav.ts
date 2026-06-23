import { Mic2, Music } from 'lucide-react'
import { can } from '../choir/capability-can'
import type { ResolvedAuth } from '../choir/capability.types'
import { uiCapabilityVisible } from '../choir/music-ui-capability-registry'
import { musicRouteTailFromPath } from '../choir/music-routes'
import { choirPath } from '../choir/paths'
import type { NavItem, NavSection } from './role-nav'

const TAIL_TO_UI: Record<string, string> = {
  music: 'music-library-hub',
  'music-direction': 'music-direction-hub',
}

/** Legacy permission fallback for `/choir/music-direction` (see role-nav HUB_PERMISSIONS). */
export const LEGACY_MUSIC_DIRECTION_HUB_PERMISSIONS = [
  'choir.music.manage',
  'choir.rehearsal.manage',
] as const

export const LEGACY_MUSIC_DIRECTION_HUB_PATH = '/choir/music-direction'

function navGateVisible(uiId: string, auth: ResolvedAuth | undefined): boolean {
  if (!auth) return false
  return uiCapabilityVisible(uiId, (capId) => can(auth, capId))
}

export function musicNavGateForPath(path: string): string | null {
  const tail = musicRouteTailFromPath(path)
  if (!tail) return null
  return TAIL_TO_UI[tail] ?? null
}

export function pageAccessForMusicRoute(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  const uiId = musicNavGateForPath(path)
  if (!uiId) return true
  return navGateVisible(uiId, auth)
}

export function pageAccessForMusicRouteWithCheck(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  const uiId = musicNavGateForPath(path)
  if (!uiId) return true
  return uiCapabilityVisible(uiId, check)
}

/** Legacy `/choir/music-direction` hub link — capability router when available. */
export function legacyMusicDirectionHubLinkVisible(
  permissions: string[],
  capabilityCheck?: (capId: string) => boolean,
): boolean {
  if (capabilityCheck) {
    return uiCapabilityVisible('music-direction-hub', capabilityCheck)
  }
  return LEGACY_MUSIC_DIRECTION_HUB_PERMISSIONS.some((p) => permissions.includes(p))
}

export function musicNavItemVisible(
  path: string,
  auth: ResolvedAuth | undefined,
): boolean {
  return pageAccessForMusicRoute(path, auth)
}

export function musicNavItemVisibleWithCheck(
  path: string,
  check: (capabilityId: string) => boolean,
): boolean {
  return pageAccessForMusicRouteWithCheck(path, check)
}

function filterItems(items: NavItem[], auth: ResolvedAuth | undefined): NavItem[] {
  return items.filter((item) => {
    const uiId = musicNavGateForPath(item.path)
    if (!uiId) return true
    return navGateVisible(uiId, auth)
  })
}

export function applyMusicNavOverrides(
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

export function augmentMusicNavSections(
  sections: NavSection[],
  choirId: string,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  if (!auth) return sections

  const extras: NavItem[] = []
  const libraryPath = choirPath(choirId, 'music')
  const directionPath = choirPath(choirId, 'music-direction')

  if (
    !pathInSections(sections, libraryPath)
    && pageAccessForMusicRoute(libraryPath, auth)
  ) {
    extras.push({ label: 'Music library', path: libraryPath, icon: Music })
  }
  if (
    !pathInSections(sections, directionPath)
    && pageAccessForMusicRoute(directionPath, auth)
  ) {
    extras.push({ label: 'Music direction', path: directionPath, icon: Mic2 })
  }

  if (extras.length === 0) return sections

  const idx = sections.findIndex((s) => s.section === 'Quick links')
  if (idx >= 0) {
    return sections.map((sec, i) =>
      i === idx ? { ...sec, items: [...sec.items, ...extras] } : sec,
    )
  }
  return [...sections, { section: 'Music', items: extras }]
}

export function composeMusicAwareNav(
  sections: NavSection[],
  choirId: string | null | undefined,
  auth: ResolvedAuth | undefined,
): NavSection[] {
  const withOverrides = applyMusicNavOverrides(sections, auth)
  if (!choirId) return withOverrides
  return augmentMusicNavSections(withOverrides, choirId, auth)
}
