import type {
  ChurchScheduleActivityType,
  ChurchScheduleSubmissionStatus,
} from '@/lib/api/modules/churchSchedule'

export const ACTIVITY_TYPE_LABELS: Record<ChurchScheduleActivityType, string> = {
  PRAYER: 'Prayer',
  REHEARSAL: 'Rehearsal',
  MEETING: 'Meeting',
  TRAINING: 'Training',
  CONCERT: 'Concert',
  FELLOWSHIP: 'Fellowship',
  OTHER_CHURCH_FACING: 'Other (church-facing)',
}

export const SUBMISSION_STATUS_LABELS: Record<ChurchScheduleSubmissionStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  AUTO_PUBLISHED: 'Published (auto)',
  CONFLICT_HELD: 'Conflict — pending office',
  ADMIN_PUBLISHED: 'Published (admin)',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COUNTER_PROPOSED: 'Counter-proposal',
}

export function submissionStatusVariant(
  status: ChurchScheduleSubmissionStatus,
): 'status-present' | 'status-excused' | 'status-absent' | 'status-late' {
  switch (status) {
    case 'AUTO_PUBLISHED':
    case 'ADMIN_PUBLISHED':
      return 'status-present'
    case 'CONFLICT_HELD':
    case 'COUNTER_PROPOSED':
      return 'status-late'
    case 'REJECTED':
    case 'CANCELLED':
      return 'status-absent'
    default:
      return 'status-excused'
  }
}

export function toLocalDatetimeInput(d: Date | string = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toDateInput(d: Date | string = new Date()) {
  const date = typeof d === 'string' ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function weekRange(anchor = new Date()) {
  const start = new Date(anchor)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return { from: start.toISOString(), to: end.toISOString() }
}
