import { parseChoirIdFromPath } from '@/lib/choir/paths'
import { isSovereignOfficePath } from '@/lib/choir/office-themes'

export type WorkspaceContext = {
  choirId: string | null
  choirName: string | null
  office: string | null
  roleLabel: string | null
}

export function resolveWorkspaceContext(
  pathname: string,
  choirName?: string | null,
  roleLabel?: string | null,
): WorkspaceContext {
  const choirId = parseChoirIdFromPath(pathname)
  let office: string | null = null

  if (pathname.includes('/membership')) office = 'Membership'
  else if (pathname.includes('/family-leadership')) office = 'Family leadership'
  else if (pathname.includes('/family-deputy')) office = 'Family deputy'
  else if (pathname.includes('/family-coordination')) office = 'Family coordination'
  else if (isSovereignOfficePath(pathname) && pathname.includes('/members')) office = 'Operations'
  else if (isSovereignOfficePath(pathname) && pathname.includes('/scheduling')) office = 'Operations'
  else if (isSovereignOfficePath(pathname) && pathname.includes('/activities')) office = 'Operations'
  else if (isSovereignOfficePath(pathname) && pathname.includes('/service-preparation')) office = 'Operations'
  else if (pathname.includes('/president')) office = 'President'
  else if (pathname.includes('/protocol')) office = 'Protocol'
  else if (pathname.includes('/church')) office = 'Church'
  else if (pathname.startsWith('/portal')) office = 'Portal'

  return {
    choirId,
    choirName: choirName ?? null,
    office,
    roleLabel: roleLabel ?? null,
  }
}
