# Protocol Invitations

Protocol membership is **invitation-first**. Members cannot self-join without an invitation or an approved claim.

## Invitation flow

1. Coordinator: `POST /protocol/invitations` (`protocol.invite` or `protocol.manage`).
2. Member: `GET /protocol/invitations/mine`.
3. Member: `PATCH /protocol/invitations/:id` with `ACCEPTED` or `DECLINED`.
4. On accept, `OperationalUnitMembership` for `PROTOCOL_TEAM` is activated.

Invitations expire automatically when `expiresAt` passes.

## Existing members

`POST /protocol/claims` — “I am already a Protocol member”. Coordinators approve via `PATCH /protocol/claims/:id`.
