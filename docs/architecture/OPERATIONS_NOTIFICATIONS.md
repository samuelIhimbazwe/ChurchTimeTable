# Operations Notifications (MF-7)

## `OperationNotification` kinds

- `ASSIGNMENT_CREATED`
- `ASSIGNMENT_CONFIRMED` / `ASSIGNMENT_DECLINED`
- `OPERATION_PUBLISHED` / `OPERATION_CANCELLED`
- `CONFLICT_DETECTED`

Default reminder offsets: 30, 14, 7, 2 days before `startAt` (see `DEFAULT_REMINDER_DAYS`).

Also pushes generic `NotificationType.OPERATION_ASSIGNMENT` / `OPERATION_SCHEDULE` via `NotificationsService`.
