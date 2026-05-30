export const enMessages: Record<string, string> = {

  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',

  BAD_REQUEST: 'Invalid request.',

  UNAUTHORIZED: 'Invalid credentials.',

  FORBIDDEN: 'You do not have permission for this action.',

  NOT_FOUND: 'The requested resource was not found.',

  VALIDATION_ERROR: 'Validation failed.',

  CONFLICT: 'Schedule conflict detected.',

  BUSINESS_RULE_VIOLATION: 'This action violates church rules.',

  SCHEDULE_OVERLAP: 'Member already has a conflicting assignment.',

  DOUBLE_BOOKING: 'Member is already assigned to this event.',

  PROTOCOL_QUOTA_FULL: 'This protocol service already has 12 members.',

  PROTOCOL_MONTHLY_LIMIT:

    'Member has reached the monthly protocol service limit.',

  MINISTRY_CONFLICT: 'Member ministry does not match this event.',

  CHILDREN_CHOIR_SERVICE1:

    'Only children choir may be assigned to Service 1.',

  ATTENDANCE_LOCKED: 'Attendance is locked after 48 hours.',

  SWAP_NOT_ALLOWED: 'Swap is not allowed for this event.',

  NOTIFICATION_EVENT_ASSIGNMENT_TITLE: 'New assignment',

  NOTIFICATION_EVENT_ASSIGNMENT_BODY:

    'You were assigned to: {eventName}',

  NOTIFICATION_SWAP_TITLE: 'Swap update',

  NOTIFICATION_SWAP_REQUESTED_BODY:

    '{memberName} requested to swap with you',

  NOTIFICATION_SWAP_ACCEPTED_BODY:

    '{memberName} accepted your swap request',

  NOTIFICATION_SWAP_REJECTED_BODY:

    '{memberName} declined your swap request',

  NOTIFICATION_SWAP_APPROVED_BODY:

    'Leader approved swap with {memberName}',

  NOTIFICATION_SWAP_FINALIZED_BODY:

    'Swap finalized for {eventName}',

  NOTIFICATION_SWAP_PENDING_LEADER_TITLE: 'Swap awaiting review',

  NOTIFICATION_SWAP_PENDING_LEADER_BODY:

    'A swap request needs team-head review for {eventName}',

  NOTIFICATION_REPLACEMENT_TITLE: 'Replacement update',

  NOTIFICATION_REPLACEMENT_REQUESTED_BODY:

    'Replacement request submitted for {eventName}',

  NOTIFICATION_REPLACEMENT_COVER_ASSIGNED_BODY:

    '{memberName} volunteered to cover for {eventName}',

  NOTIFICATION_REPLACEMENT_APPROVED_BODY:

    'Replacement approved for {eventName}',

  NOTIFICATION_REPLACEMENT_REJECTED_BODY:

    'Replacement request declined for {eventName}',

  NOTIFICATION_REPLACEMENT_FINALIZED_BODY:

    'Replacement finalized for {eventName}',

  NOTIFICATION_REPLACEMENT_PENDING_LEADER_TITLE: 'Replacement awaiting review',

  NOTIFICATION_REPLACEMENT_PENDING_LEADER_BODY:

    'A replacement request needs review for {eventName}',

  NOTIFICATION_COVERAGE_ESCALATION_TITLE: 'Coverage escalation ({level})',

  NOTIFICATION_COVERAGE_ESCALATION_BODY:

    '{memberName} — {eventName}. {notes}',

  NOTIFICATION_READINESS_WARNING_TITLE: 'Service readiness warning',

  NOTIFICATION_READINESS_WARNING_BODY:

    '{eventName} readiness: {status}',

  NOTIFICATION_ATTENDANCE_TITLE: 'Attendance recorded',

  NOTIFICATION_ATTENDANCE_BODY:

    'Your attendance for {eventName} was recorded',

  NOTIFICATION_ATTENDANCE_ABSENCE_TITLE: 'Attendance follow-up needed',

  NOTIFICATION_ATTENDANCE_ABSENCE_BODY:

    'A team member absence was recorded for {eventName}',

  NOTIFICATION_ATTENDANCE_ESCALATION_TITLE: 'Attendance escalation ({level})',

  NOTIFICATION_ATTENDANCE_ESCALATION_BODY:

    '{memberName} — {eventName}. {notes}',

  NOTIFICATION_EXCUSED_REVIEW_TITLE: 'Excuse review update',

  NOTIFICATION_EXCUSED_APPROVED_BODY:

    'Your excused absence for {eventName} was approved',

  NOTIFICATION_EXCUSED_REJECTED_BODY:

    'Your excused absence for {eventName} was not approved',

  NOTIFICATION_DISCIPLINE_TITLE: 'Discipline case',

  NOTIFICATION_DISCIPLINE_BODY:

    'A discipline case was opened: {caseTitle}',

  NOTIFICATION_DUES_TITLE: 'Choir finance',

  NOTIFICATION_DUES_BODY: 'Remaining balance: {amount}',

  INVALID_CREDENTIALS: 'Invalid email or password.',
  INVALID_SESSION: 'Your session has expired. Please sign in again.',
  EMAIL_ALREADY_REGISTERED: 'This email is already registered.',
  ACCOUNT_INACTIVE: 'This account is inactive. Contact your ministry leader.',
  MEMBER_PENDING_APPROVAL:
    'Your registration is awaiting leader approval.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a moment and try again.',
  NOTIFICATION_MEMBER_APPROVED_TITLE: 'Registration approved',
  NOTIFICATION_MEMBER_APPROVED_BODY:
    'Welcome! Your ministry registration has been approved. You now have full access.',
  NOTIFICATION_MEMBER_REJECTED_TITLE: 'Registration update',
  NOTIFICATION_MEMBER_REJECTED_BODY:
    'Your registration was not approved. Contact your ministry leader for help.',

};

