const WELCOME_DEFERRED_KEY = 'cmms-tour-welcome-deferred'

export function isWelcomeDeferred(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(WELCOME_DEFERRED_KEY) === '1'
}

export function deferWelcome(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(WELCOME_DEFERRED_KEY, '1')
}

export function clearWelcomeDeferral(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(WELCOME_DEFERRED_KEY)
}
