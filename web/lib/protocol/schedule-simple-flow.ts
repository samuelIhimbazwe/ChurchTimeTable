export type SimpleScheduleStep = 'make' | 'check' | 'send'

/** Memorable 3-step flow: Make → Check → Send */
export function simpleScheduleStep(status: string, hasPlan: boolean): SimpleScheduleStep {
  if (!hasPlan) return 'make'
  if (status === 'PUBLISHED') return 'send'
  if (status === 'APPROVED') return 'send'
  return 'check'
}

export function simpleStepIndex(step: SimpleScheduleStep): number {
  return { make: 0, check: 1, send: 2 }[step]
}

export const SCHEDULE_STEPS = [
  { id: 'make' as const, label: 'Make', hint: 'Auto-build the month' },
  { id: 'check' as const, label: 'Check', hint: 'Fix any choir' },
  { id: 'send' as const, label: 'Send', hint: 'Publish to choirs' },
]
