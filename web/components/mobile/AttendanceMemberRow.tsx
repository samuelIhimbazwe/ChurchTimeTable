'use client'

import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Avatar } from '@/components/shared'
import { SwipeableRow } from '@/components/mobile/SwipeableRow'
import { cn } from '@/lib/utils'
import type { ChoirAttendanceOutcome } from '@/types'

const QUICK_OUTCOMES: {
  label: string
  outcome: ChoirAttendanceOutcome
  icon: React.ElementType
  color: string
}[] = [
  { label: 'Present', outcome: 'PRESENT_FULL', icon: CheckCircle2, color: 'text-success' },
  { label: 'Late', outcome: 'PRESENT_LATE', icon: Clock, color: 'text-warning' },
  { label: 'Absent', outcome: 'ABSENT_UNEXCUSED', icon: XCircle, color: 'text-danger' },
  { label: 'Excused', outcome: 'ABSENT_EXCUSED', icon: CheckCircle2, color: 'text-info' },
]

const OUTCOME_STYLE: Record<string, string> = {
  PRESENT_FULL: 'bg-success-light border-success text-success',
  PRESENT_LATE: 'bg-warning-light border-warning text-warning',
  ABSENT_UNEXCUSED: 'bg-danger-light border-danger text-danger',
  ABSENT_EXCUSED: 'bg-info-light border-info text-info',
  PRESENT_LEFT_EARLY: 'bg-warning-light border-warning text-warning',
  PRESENT_LATE_LEFT_EARLY: 'bg-warning-light border-warning text-warning',
}

type Props = {
  memberId: string
  memberName: string
  outcome: ChoirAttendanceOutcome | null
  onMark: (memberId: string, outcome: ChoirAttendanceOutcome) => void
  rowRef?: React.Ref<HTMLLIElement>
}

export function AttendanceMemberRow({ memberId, memberName, outcome, onMark, rowRef }: Props) {
  return (
    <li ref={rowRef} className="list-none">
      <SwipeableRow
        rightAction={{
          id: 'present',
          label: 'Present',
          className: 'bg-success-light text-success',
          onTrigger: () => onMark(memberId, 'PRESENT_FULL'),
        }}
        leftAction={{
          id: 'absent',
          label: 'Absent',
          className: 'bg-danger-light text-danger',
          onTrigger: () => onMark(memberId, 'ABSENT_UNEXCUSED'),
        }}
      >
        <div className="px-4 py-3 min-h-[4.5rem] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Avatar name={memberName} size="sm" />
            <span className="text-sm font-medium text-text-primary flex-1 min-w-0 truncate">
              {memberName}
            </span>
            {outcome && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium shrink-0',
                  OUTCOME_STYLE[outcome],
                )}
              >
                {outcome.replace(/_/g, ' ').toLowerCase()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 ml-11 sm:ml-11">
            {QUICK_OUTCOMES.map(({ label, outcome: o, icon: Icon, color }) => (
              <button
                key={o}
                type="button"
                onClick={() => onMark(memberId, o)}
                className={cn(
                  'touch-target flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-fast min-h-[2.75rem]',
                  outcome === o
                    ? `${OUTCOME_STYLE[o]} border-current`
                    : `border-border text-text-muted hover:border-current active:scale-[0.98]`,
                )}
              >
                <Icon size={14} className={outcome === o ? '' : color} />
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2 ml-11 sm:hidden">
            Swipe right = present · left = absent
          </p>
        </div>
      </SwipeableRow>
    </li>
  )
}

export { QUICK_OUTCOMES, OUTCOME_STYLE }
