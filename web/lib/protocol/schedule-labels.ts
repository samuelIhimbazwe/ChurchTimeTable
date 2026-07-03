const TEMPLATE_LABELS_RW: Record<string, string> = {
  SUNDAY_SERVICE_1: 'Iteraniro rya Mbere',
  SUNDAY_SERVICE_2: 'Iteraniro rya Kabiri',
  TUESDAY_SERVICE: 'Kuwa Kabiri',
  FRIDAY_SERVICE: 'Kuwa Gatanu',
  IGABURO: 'Igaburo Ryera',
}

const TEMPLATE_LABELS_EN: Record<string, string> = {
  SUNDAY_SERVICE_1: 'First service',
  SUNDAY_SERVICE_2: 'Second service',
  TUESDAY_SERVICE: 'Tuesday service',
  FRIDAY_SERVICE: 'Friday service',
  IGABURO: 'Holy communion',
}

export function protocolServiceLabelRw(templateCode?: string | null, title?: string) {
  if (templateCode && TEMPLATE_LABELS_RW[templateCode]) return TEMPLATE_LABELS_RW[templateCode]
  return title ?? 'Service'
}

export function protocolServiceLabelEn(templateCode?: string | null, title?: string) {
  if (templateCode && TEMPLATE_LABELS_EN[templateCode]) return TEMPLATE_LABELS_EN[templateCode]
  return title ?? 'Service'
}

export type PlanWorkflowStep = 'draft' | 'review' | 'approved' | 'published'

export function planWorkflowStep(status: string): PlanWorkflowStep {
  if (status === 'PUBLISHED') return 'published'
  if (status === 'APPROVED') return 'approved'
  if (status === 'GENERATED' || status === 'DRAFT') return 'review'
  return 'draft'
}

export function planStatusLabel(status: string) {
  switch (status) {
    case 'GENERATED':
    case 'DRAFT':
      return 'Draft'
    case 'APPROVED':
      return 'Approved'
    case 'PUBLISHED':
      return 'Published'
    case 'ARCHIVED':
      return 'Archived'
    default:
      return status
  }
}
