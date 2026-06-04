# Ministry Notifications (MF-3)

Ministry-scoped notification categories; `Notification.ministryId` prevents cross-ministry delivery mistakes.

## Types

- `MINISTRY_ANNOUNCEMENT`
- `MINISTRY_DOCUMENT`
- `MINISTRY_MEETING`
- `MINISTRY_ACTION_ITEM`
- `MINISTRY_LEADERSHIP`
- `MINISTRY_DEVOTION`

## Delivery

`notifyMinistryMembers()` resolves active `MinistryMembership` → member `userId` and calls `NotificationsService.create(..., ministryId)`.

## Rules

- Only enrolled/active ministry members receive ministry notifications.
- Choir devotion notifications remain `CHOIR_DEVOTION` with `choirId` until choir migration.
- No protocol or multi-church routing in MF-3.
