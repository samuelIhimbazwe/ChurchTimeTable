import { ChoirServiceAssignmentStatus } from '@prisma/client';

/** Assignments visible to choir members and announced on calendars. */
export const CONFIRMED_ASSIGNMENT_FILTER = {
  cancelledAt: null,
  status: ChoirServiceAssignmentStatus.CONFIRMED,
} as const;
