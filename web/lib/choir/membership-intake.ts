/** Closed choir: singers and sponsors are provisioned by leadership (no self-serve join). */
export const INTERNAL_CHOIR_MEMBERSHIP = true as const

export const MEMBER_ONBOARDING_SEGMENT = 'member-onboarding' as const

export function memberOnboardingHref(
  choirLink: (...segments: string[]) => string,
): string {
  return choirLink(MEMBER_ONBOARDING_SEGMENT)
}
