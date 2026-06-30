# Interactive product tour

CMMS uses an **interactive guided tour** instead of a mandatory orientation video. New users see a welcome modal after first login; the tour highlights real UI with role-based explanations.

## User flows

| Action | Behavior |
|--------|----------|
| Start tour | Spotlight steps on portal + shell; completes onboarding when finished |
| Remind me later | Defers welcome; portal shows resume card next visit |
| Skip for now | `PATCH /auth/onboarding-complete` — no tour |
| Help → Replay product tour | Restarts tour anytime (does not reset onboarding flag) |

## Role-based personas

Resolved in `web/lib/tour/personas.ts` from system role + permissions:

| Persona | Typical roles |
|---------|----------------|
| `member` | Default |
| `choir_leader` | Choir president, secretary, music director, etc. |
| `treasurer` | Choir treasurer, finance permissions |
| `protocol_coordinator` | Protocol leader/admin |

Extra steps (choir dashboard, finance focus, protocol card, attention inbox) appear per persona.

## Maintaining the tour

1. **Steps** — `web/lib/tour/steps.ts` (order, `data-tour` target, optional `route`)
2. **Copy** — `web/lib/tour/tour-ui.ts` (EN; FR/RW reuse EN until translated)
3. **Targets** — add `data-tour="…"` on components; use unique IDs from `steps.ts`
4. **Shell** — `ProductTourProvider` in `Shell.tsx` orchestrates welcome + tour

## Optional orientation video

For churches that still want a recorded walkthrough, see `docs/ORIENTATION_VIDEO_SCRIPT.md`. The video script references the same portal routes; the in-app tour is the primary onboarding path.
