# Dashboard UX

## Default routing

| User type | Post-login destination |
|-----------|------------------------|
| New registration | `/portal` (immediate) |
| Choir join pending | Join request status on `/portal/choirs` |
| Protocol pending | Invitation or claim status on portal |
| Legacy `NEW_MEMBER` (import/admin) | Mobile may show pending screen; some APIs gated |
| Platform admin / operational leader | `/dashboard` (leader experience) |
| Approved church member | `/dashboard/member` |

## Leader action centers

Leaders with elevated permissions continue to use `/dashboard` with role-specific widgets. Choir presidents and protocol coordinators see operational action items (join requests, rehearsals, replacements, attendance).

## Empty states

Use `CmmsEmptyState` for no choir, no events, no announcements, and similar gaps — always with a clear next action.

## Errors

Client messages avoid raw HTTP status text. Use `getApiErrorMessage()` which returns user-friendly fallbacks.
