# Choir Join Workflow

1. Member browses `GET /choirs/public`.
2. Member submits `POST /choirs/join-requests` with `requestType` (VISITOR, PERMANENT_MEMBER, RETURNING_MEMBER, OTHER).
3. Choir admin reviews via `PATCH /choirs/join-requests/:id` with `APPROVED`, `REJECTED`, or `NEEDS_INFO`.
4. On approval, `ChoirMembership` is created and the member is notified.

Members may `withdraw: true` on PATCH to cancel a pending request.
