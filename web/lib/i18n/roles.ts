import type { AppLocale } from './auth-ui'
import { translateLabel } from './labels'

/** Localize API role slugs and display names shown in the shell. */
export function translateRole(role: string | undefined, locale: AppLocale): string {
  if (!role) return translateLabel('Member', locale)
  const normalized = role.replace(/_/g, ' ').trim()
  const key = normalized
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  const fromLabel = translateLabel(key, locale)
  if (fromLabel !== key) return fromLabel
  const upper = role.toUpperCase()
  const map: Record<string, string> = {
    MEMBER: translateLabel('Member', locale),
    CHOIR_MEMBER: translateLabel('Member', locale),
    CHOIR_LEADER: translateLabel('Music Director', locale),
    PROTOCOL_LEADER: translateLabel('Protocol', locale),
    ADMIN: translateLabel('Admin Tools', locale),
    SUPER_ADMIN: translateLabel('Admin Tools', locale),
  }
  return map[upper] ?? fromLabel
}
