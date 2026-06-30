import type { TourPersona, TourStep } from './types'

/** Ordered spotlight steps — filtered per persona at runtime. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'portal-home',
    target: 'portal-hero',
    route: '/portal',
    personas: 'all',
  },
  {
    id: 'quick-actions',
    target: 'portal-quick-actions',
    route: '/portal',
    personas: 'all',
  },
  {
    id: 'participation',
    target: 'portal-participation',
    route: '/portal',
    personas: 'all',
  },
  {
    id: 'choir-office',
    target: 'portal-choir-entry',
    route: '/portal',
    personas: ['choir_leader'],
  },
  {
    id: 'finance-focus',
    target: 'portal-quick-actions',
    route: '/portal',
    personas: ['treasurer'],
  },
  {
    id: 'protocol-focus',
    target: 'portal-protocol',
    route: '/portal',
    personas: ['protocol_coordinator'],
  },
  {
    id: 'navigation',
    target: 'nav-sidebar',
    personas: 'all',
  },
  {
    id: 'search',
    target: 'topbar-search',
    personas: 'all',
  },
  {
    id: 'attention',
    target: 'topbar-attention',
    personas: ['choir_leader', 'treasurer', 'protocol_coordinator'],
  },
  {
    id: 'notifications',
    target: 'topbar-notifications',
    personas: 'all',
  },
  {
    id: 'help',
    target: 'topbar-help',
    personas: 'all',
  },
]

export function stepsForPersona(persona: TourPersona): TourStep[] {
  return TOUR_STEPS.filter(
    (step) =>
      step.personas === 'all'
      || step.personas.includes(persona),
  )
}
