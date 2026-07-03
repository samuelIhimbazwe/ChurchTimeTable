import {
  Home,
} from 'lucide-react'

import type { NavSection } from '@/lib/navigation/role-nav'

import { resolveProtocolLandingPath } from '@/lib/protocol/officer-roles'

import {
  getProtocolPrimaryNav,
  protocolLandingPath,
} from '@/lib/navigation/protocol-module-nav'



const BACK_TO_PORTAL: NavSection = {

  items: [{ label: 'Member portal', icon: Home, path: '/portal' }],

}



/** Composed sidebar for `/protocol/*` — primary modules only; sub-features use the tab bar. */

export function getComposedProtocolNav(
  ministryName: string,
  permissions: string[],
  positions: Array<{ roleKey: string }> = [],
  options?: { isDualMember?: boolean },
): NavSection[] {
  const landing = protocolLandingPath(positions)
  const primary = getProtocolPrimaryNav(permissions, landing)

  return [
    ...(options?.isDualMember ? [BACK_TO_PORTAL] : []),
    {
      section: ministryName,
      items: primary,
    },
  ]
}



export function protocolDashboardEntryPath(

  positions: Array<{ roleKey: string }> = [],

): string {

  return resolveProtocolLandingPath(positions)

}
