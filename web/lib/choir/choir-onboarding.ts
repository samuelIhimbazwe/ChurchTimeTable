export type ChoirOnboardingStepId =
  | 'profile'
  | 'family'
  | 'prep'
  | 'giving'
  | 'assignments'

export type ChoirOnboardingStep = {
  id: ChoirOnboardingStepId
  label: string
  description: string
  href: string
  done: boolean
}

const DISMISS_KEY = (choirId: string) => `choir-onboarding-dismissed-${choirId}`
const CELEBRATION_KEY = (choirId: string) => `choir-onboarding-celebrated-${choirId}`

export function isChoirOnboardingCelebrated(choirId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(CELEBRATION_KEY(choirId)) === '1'
}

export function markChoirOnboardingCelebrated(choirId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CELEBRATION_KEY(choirId), '1')
}

export function isChoirOnboardingDismissed(choirId: string): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(DISMISS_KEY(choirId)) === '1'
}

export function dismissChoirOnboarding(choirId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(DISMISS_KEY(choirId), '1')
}

export function shouldShowChoirOnboarding(
  steps: ChoirOnboardingStep[],
  choirId: string,
): boolean {
  if (isChoirOnboardingDismissed(choirId)) return false
  return steps.some((s) => !s.done)
}
