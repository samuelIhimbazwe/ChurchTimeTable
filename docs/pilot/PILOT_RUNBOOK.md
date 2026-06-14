# Pilot runbook (choir + protocol)

## Roles

| Role | Responsibility in pilot |
|------|-------------------------|
| **Admin** | Accounts, passwords, audit if disputes |
| **Choir leader** | Choir events, assignments, attendance, swaps |
| **Protocol leader** | Protocol services (max 12, 3/month rule), attendance |
| **Members** | View assignments, mark attendance, request swap/replacement |

## Week 0 — Setup (once)

1. Run `backend/scripts/pilot-setup.ps1` or production equivalent.
2. Replace seed members with real people (or add via register + admin approve).
3. Create **real** events for the next 4 Sundays.
4. Install app on leader phones; verify login and calendar shows events.
5. Walk through [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md).

## Weekly rhythm

| Day | Action |
|-----|--------|
| **Monday** | Leader reviews dashboard KPIs (pending swaps/replacements, upcoming events). |
| **Wednesday** | Confirm Sunday assignments; use **Validate** on assignment screen if adding members. |
| **Saturday** | Members check calendar; submit swap/replacement if unavailable. |
| **Sunday** | After service: **bulk attendance** on event detail; sync if offline. |
| **Monday** | Admin checks sync conflicts; resolve or retry. |

## Sunday — choir leader (15 min)

1. Open app → **Kalendari** → tap Sunday choir service.
2. **Mark attendance** → set Present / Late / Absent for each assigned member → Save.
3. If phone had no signal: open **Guhuza amakuru** → Sync now.
4. Approve any pending **Gusimburana** / **Gusimbura** from dashboard counts.

## Sunday — protocol coordinator (web, 20 min)

1. **Church calendar** → `/church/calendar` — confirm Sunday MF-7 occurrence is published with protocol slot.
2. **Build team** → `/protocol/teams/generate` — select occurrence, pick members (respect 12 cap / monthly quota).
3. **Publish queue** → `/protocol/teams` — approve and publish roster (members get assignments).
4. After service: team head marks attendance on `/protocol/teams/[occurrenceId]`.
5. **Replacements** → `/protocol/replacements` — approve any member substitution requests.
6. **Health pack** (weekly) → `/protocol/reports` — download ministry health PDF for leadership.

## Sunday — protocol member (mobile, 10 min)

1. Open **Protocol** dashboard → review published assignments.
2. Tap assignment for service details; request **replacement** if unavailable.
3. **Submit contribution** or view treasury (read-only) as needed.
4. Pull to refresh if roster was published after you opened the app.

## Protocol web routes (pilot)

| Route | Actor | Purpose |
|-------|-------|---------|
| `/protocol/coordinator` | Coordinator | Command home + SLA |
| `/protocol/president` | President | Oversight + claims |
| `/protocol/teams/generate` | Coordinator | MF-7 team build |
| `/protocol/teams` | Ops | Publish queue |
| `/protocol/replacements` | Coordinator / team head | Substitution queue |
| `/protocol/claims` | President / admin | Membership claims |
| `/protocol/reports` | Secretary / president | Health score + PDF |
| `/protocol/documents` | All protocol members | Deacons ministry document shelf |
| `/protocol/secretary` | Secretary | Records desk + roster |
| `/admin/import` | Admin | Import Center (`PROTOCOL_MEMBERS` CSV) |

**Pilot accounts:** `protocol.coordinator@church.local`, `protocol.leader@church.local`, `protocol.teamhead@church.local` — password `Pilot@123`.

## When something fails

| Symptom | What to do |
|---------|------------|
| “Cannot login” | Check API URL on device; server running; password reset by admin. |
| Empty calendar | Create events; pull to refresh; check leader has `event:read`. |
| Assignment rejected | Read error (overlap / quota); adjust roster or use override + reason. |
| Sync rejected | Open Sync → read conflict reason; fix on server or discard bad queue item. |
| App in English unexpectedly | Settings → Language → Ikinyarwanda. |
| No protocol services on build page | Publish MF-7 occurrence with `PROTOCOL_TEAM` assignment slot; run pilot seed. |
| Import preview fails | Use UTF-8 CSV; columns `email` or `memberNumber` for protocol members. |

## Pilot success metrics (track weekly)

- % assigned members with attendance recorded within 48h
- Number of sync conflicts (target: down week over week)
- Leader satisfaction (1–5): calendar, attendance, swaps
- Member complaints about wrong language or labels (target: 0 critical)
- Protocol: % published teams with attendance within 48h; pending replacement age

## End of pilot (week 4–8)

- Decide: expand to full church, stay choir-only, or pause.
- Export attendance report (PDF/CSV from API) for committee review.
- Download protocol health pack from `/protocol/reports` for committee packet.
- Rotate `JWT_SECRET` and passwords if pilot used shared `Pilot@123`.
