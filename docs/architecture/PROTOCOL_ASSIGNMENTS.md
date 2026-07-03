# Protocol Assignments

## Modes

| Mode | Templates |
|------|-----------|
| SUNDAY | Sunday Service 1 & 2 |
| TUESDAY | Tuesday Service, Friday Service |
| IGABURO | IGABURO |
| SPECIAL_EVENT | Concerts, conferences, revivals |

## Team size

Every official team is **10 members** (`PROTOCOL_TEAM_SIZING.TEAM_SIZE_TARGET`).

## Sunday / Tuesday / IGABURO composition

1. **Singing choir members first** — only members whose choir is confirmed to sing at *this* occurrence (not another service the same day).
2. **Non-choir members** — fill remaining slots up to `maxNonChoirMembers` (default 3).
3. Choir caps when multiple choirs sing: one choir → up to 7 choir members; two choirs → up to 4 per choir.

Members who belong to any choir but whose choir is **not** singing at this occurrence are excluded entirely.

## Monthly batch build (`POST /protocol/scheduling/plans/:id/build-teams`)

Processes occurrences chronologically within the published plan:

| Rule | Behavior |
|------|----------|
| Same calendar day | A member cannot appear on two teams the same day |
| Monthly cap | Hard stop at 3 official assignments per member per month (DB + in-flight batch) |

Optional `buildProtocolTeams: true` on publish runs the same builder after choir assignments are sent.

## Special events

Leader sets team size; engine recommends only.

## Three-service rule

`ServiceQuotaEngine.countAssignmentsInMonth` counts all draft and published official team slots in the calendar month. Members at the cap are excluded from recommendations (not merely deprioritized). Overrides are audited via `quotaOverrideReason` on team members.

## Override

Leaders with `protocol.manage` or `protocol.assignment.override` may pass explicit `memberIds` to `POST /protocol/teams/generate`.
