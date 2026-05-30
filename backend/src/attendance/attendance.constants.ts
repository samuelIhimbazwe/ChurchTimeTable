import { AttendanceOperationalStatus } from '@prisma/client';

/** Default attendance weighting — override via SystemSetting key `attendance.weights` */
export const DEFAULT_ATTENDANCE_WEIGHTS: Record<
  AttendanceOperationalStatus,
  number
> = {
  ATTENDED: 1.0,
  LATE: 0.7,
  EXCUSED_ABSENCE: 0.85,
  UNEXCUSED_ABSENCE: 0,
  REPLACEMENT_SERVED: 1.0,
  VOLUNTARY_EXTRA_SERVICE: 0.15,
};

export const ATTENDANCE_WEIGHTS_SETTING_KEY = 'attendance.weights';

export const ATTENDANCE_SCORE_BANDS = {
  excellent: { min: 70, label: 'excellent', tone: 'success' as const },
  good: { min: 40, label: 'good', tone: 'info' as const },
  danger: { min: 0, label: 'danger', tone: 'danger' as const },
};

export const STRUCTURED_EXCUSE_REASONS = [
  'illness',
  'travel',
  'work_school',
  'emergency',
  'family_issue',
  'approved_leave',
  'unavoidable_conflict',
  'unknown',
] as const;
