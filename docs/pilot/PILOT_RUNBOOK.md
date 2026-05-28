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

## Sunday — protocol leader (15 min)

Same flow on protocol service event. Respect **12 members per service** when assigning (system blocks over-quota).

## When something fails

| Symptom | What to do |
|---------|----------------|
| “Cannot login” | Check API URL on device; server running; password reset by admin. |
| Empty calendar | Create events; pull to refresh; check leader has `event:read`. |
| Assignment rejected | Read error (overlap / quota); adjust roster or use override + reason. |
| Sync rejected | Open Sync → read conflict reason; fix on server or discard bad queue item. |
| App in English unexpectedly | Settings → Language → Ikinyarwanda. |

## Pilot success metrics (track weekly)

- % assigned members with attendance recorded within 48h
- Number of sync conflicts (target: down week over week)
- Leader satisfaction (1–5): calendar, attendance, swaps
- Member complaints about wrong language or labels (target: 0 critical)

## End of pilot (week 4–8)

- Decide: expand to full church, stay choir-only, or pause.
- Export attendance report (PDF/CSV from API) for committee review.
- Rotate `JWT_SECRET` and passwords if pilot used shared `Pilot@123`.
