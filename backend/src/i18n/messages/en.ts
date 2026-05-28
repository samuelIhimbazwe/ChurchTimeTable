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

  NOTIFICATION_ATTENDANCE_TITLE: 'Attendance recorded',

  NOTIFICATION_ATTENDANCE_BODY:

    'Your attendance for {eventName} was recorded',

  NOTIFICATION_DISCIPLINE_TITLE: 'Discipline case',

  NOTIFICATION_DISCIPLINE_BODY:

    'A discipline case was opened: {caseTitle}',

  NOTIFICATION_DUES_TITLE: 'Choir finance',

  NOTIFICATION_DUES_BODY: 'Remaining balance: {amount}',

};

