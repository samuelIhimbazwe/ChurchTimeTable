# Protocol Assignments

## Modes

| Mode | Templates |
|------|-----------|
| SUNDAY | Sunday Service 1 & 2 |
| TUESDAY | Tuesday Service |
| IGABURO | IGABURO |
| SPECIAL_EVENT | Concerts, conferences, revivals |

## Sunday mode

Represents **main choir** members assigned on the same occurrence. Children choir is ignored. Non-choir protocol members capped by `maxNonChoirMembers` (default 3).

## Tuesday / IGABURO

Priorities:

1. Under 3-service quota (`LOW_PRIORITY` when at quota — not blocked)
2. Available / active
3. Lowest monthly official service count
4. Other choir members allowed

## Special events

Leader sets team size; engine recommends only.

## Three-service rule

`ServiceQuotaEngine` tracks official services with attendance credit in the calendar month. Overrides are audited via `quotaOverrideReason` on team members.

## Override

Leaders with `protocol.manage` or `protocol.assignment.override` may pass explicit `memberIds` to `POST /protocol/teams/generate`.
