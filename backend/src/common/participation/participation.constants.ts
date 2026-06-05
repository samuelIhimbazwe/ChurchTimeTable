import {
  ChoirAttendanceOutcome,
  ProtocolAttendanceOutcome,
} from '@prisma/client';

export type ParticipationOperationalStatus =
  | 'ATTENDED'
  | 'LATE'
  | 'EXCUSED_ABSENCE'
  | 'UNEXCUSED_ABSENCE'
  | 'REPLACEMENT_SERVED'
  | 'VOLUNTARY_EXTRA_SERVICE';

/** Default participation weighting — override via SystemSetting key `attendance.weights` */
export const DEFAULT_PARTICIPATION_WEIGHTS: Record<
  ParticipationOperationalStatus,
  number
> = {
  ATTENDED: 1.0,
  LATE: 0.7,
  EXCUSED_ABSENCE: 0.85,
  UNEXCUSED_ABSENCE: 0,
  REPLACEMENT_SERVED: 1.0,
  VOLUNTARY_EXTRA_SERVICE: 0.15,
};

export const PARTICIPATION_WEIGHTS_SETTING_KEY = 'attendance.weights';

export const PARTICIPATION_SCORE_BANDS = {
  excellent: { min: 70, label: 'excellent', tone: 'success' as const },
  good: { min: 40, label: 'good', tone: 'info' as const },
  danger: { min: 0, label: 'danger', tone: 'danger' as const },
};

export function mapChoirOutcome(
  outcome: ChoirAttendanceOutcome,
): ParticipationOperationalStatus {
  switch (outcome) {
    case ChoirAttendanceOutcome.PRESENT_FULL:
    case ChoirAttendanceOutcome.PRESENT_LEFT_EARLY:
      return 'ATTENDED';
    case ChoirAttendanceOutcome.PRESENT_LATE:
    case ChoirAttendanceOutcome.PRESENT_LATE_LEFT_EARLY:
      return 'LATE';
    case ChoirAttendanceOutcome.ABSENT_EXCUSED:
      return 'EXCUSED_ABSENCE';
    case ChoirAttendanceOutcome.ABSENT_UNEXCUSED:
    default:
      return 'UNEXCUSED_ABSENCE';
  }
}

export function mapProtocolOutcome(
  outcome: ProtocolAttendanceOutcome,
): ParticipationOperationalStatus {
  switch (outcome) {
    case ProtocolAttendanceOutcome.PRESENT_FULL:
    case ProtocolAttendanceOutcome.PRESENT_LEFT_EARLY:
      return 'ATTENDED';
    case ProtocolAttendanceOutcome.PRESENT_LATE:
    case ProtocolAttendanceOutcome.PRESENT_LATE_LEFT_EARLY:
      return 'LATE';
    case ProtocolAttendanceOutcome.ABSENT_EXCUSED:
      return 'EXCUSED_ABSENCE';
    case ProtocolAttendanceOutcome.ABSENT_SELF_REPLACED:
      return 'REPLACEMENT_SERVED';
    case ProtocolAttendanceOutcome.ABSENT_UNEXCUSED:
    default:
      return 'UNEXCUSED_ABSENCE';
  }
}
