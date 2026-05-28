# Swap lifecycle

## Actors

- Requester member
- Target member (accept/reject)
- Leader (optional approve)
- System (validation, finalize, notifications)

## States

`REQUESTED` → `TARGET_ACCEPTED` | `TARGET_REJECTED` → `LEADER_PENDING` → `APPROVED` | `REJECTED` → `FINALIZED` | `CANCELLED`

## Transitions

See `SwapStatus` in Prisma schema. Mobile labels via `swapStatusLabel()`.

## Notifications

- Each transition notifies requester, target, and leaders as configured

## Audit log actions

- `SWAP_REQUEST`, `SWAP_ACCEPT`, `SWAP_REJECT`, `SWAP_LEADER_APPROVE`, `SWAP_FINALIZE`

## Offline behavior

- Swap create/update queued as `Swap` sync entity

## Conflict rules

- Schedule overlap for both members
- Protocol monthly quota
- Assignment must exist for requester event

## Localization considerations

- Status labels: `swap_status_*` ARB keys (rw default)
