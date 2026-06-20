import type { ServicePreparationPlan } from '@/lib/api/modules/choirServiceOps'

export type PrepChecklistItem = {
  key: string
  label: string
  detail?: string
}

export function computeServicePrepReadiness(plan: ServicePreparationPlan): number {
  const items = plan.items ?? []
  const checks = [
    !!plan.uniformNotes?.trim(),
    !!plan.pepTalkTitle?.trim() || items.some((i) => i.itemType === 'PEP_TALK'),
    items.some((i) => i.itemType === 'SERVICE_SONG'),
    items.length > 0 || !!plan.uniformNotes?.trim(),
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

export function buildMemberPrepChecklist(plan: ServicePreparationPlan): PrepChecklistItem[] {
  const list: PrepChecklistItem[] = []

  if (plan.uniformNotes?.trim()) {
    list.push({
      key: 'uniform',
      label: 'Uniform',
      detail: plan.uniformNotes.trim(),
    })
  }

  if (plan.pepTalkTitle?.trim()) {
    const timing = plan.pepTalkTiming?.replace(/_/g, ' ').toLowerCase()
    list.push({
      key: 'pep_talk',
      label: 'Pep talk / short meeting',
      detail: [plan.pepTalkTitle, timing].filter(Boolean).join(' · '),
    })
  }

  for (const item of plan.items ?? []) {
    const key = item.id ? `item:${item.id}` : `item:${item.itemType}:${item.title}`
    list.push({
      key,
      label: item.title,
      detail: item.song?.title ?? item.body ?? undefined,
    })
  }

  return list
}

export function prepAckProgress(
  checklist: PrepChecklistItem[],
  acknowledgedKeys: string[],
): { done: number; total: number; pct: number } {
  const total = checklist.length
  if (total === 0) return { done: 0, total: 0, pct: 0 }
  const ackSet = new Set(acknowledgedKeys)
  const done = checklist.filter((c) => ackSet.has(c.key)).length
  return { done, total, pct: Math.round((done / total) * 100) }
}
