# Protocol System — Vision vs Current State

Last updated: June 2026 (Sprint 1 started)

---

## Architecture

Protocol is a **single ministry** using the same portal-first, role-composed pattern as choir:

```
Portal → /protocol (dashboard context gate)
├── Member hub        — stats, upcoming services, personal rankings
├── Officer hubs      — president, coordinator, secretary, treasury, team-leader
├── Teams engine      — occurrence-based ProtocolOccurrenceTeam (auto-gen on publish)
├── Attendance        — outcome model → performance stats → rankings
├── Replacements      — self-found replacement workflow
├── Rankings          — monthly multi-category + badges
├── Claims/Invites    — closed membership (no open self-join)
└── Reports/Backups   — operational exports + backup pool
```

**Onboarding (closed ministry):** See `docs/PROTOCOL_DISCOVERY.md` — invitations + membership claims only.

---

## Backend vs Frontend

| Area | Backend | Web UI | Sprint 1 status |
|------|---------|--------|-----------------|
| Teams / assignment | **Functional** (e2e tested) | List + generate + detail | **P0 fixed** — occurrence team endpoint + adapters |
| Attendance | **Functional** | Team detail page | **P0 fixed** — single-record API loop |
| Replacements | **Functional** | Review page | **P0 fixed** — path/payload adapters |
| Team status workflow | **Functional** | Team detail | **P1 added** — review/approve/publish/complete |
| Rankings | **Functional** | Monthly list | Partial — no generate trigger |
| Claims | **Functional** | Review + portal submit | **Functional** |
| Invitations | **Functional** | — | **Missing UI** |
| Officer hubs | Context ready | Quick-link shells | Scaffold |
| Treasury | Permissions only | Links only | **Missing** |
| Leader dashboard | `GET /dashboard` | Unused | **Missing** |

---

## Sprint 1 — Completed (this session)

1. **`GET /protocol/occurrences/:occurrenceId/team`** — backend lookup by occurrence
2. **`web/lib/api/modules/protocol.ts`** — adapters for team, replacements; attendance batch → single POST loop; review uses `PATCH /replacements/:id` + `{ status }`
3. **Team detail page** — fixed occurrence date field; status advance buttons

---

## Sprint 1 — P1 completed

| Item | Status |
|------|--------|
| Invitation management UI | `/protocol/invitations` — send + list; portal/member accept/decline |
| Member replacement request | Form on `/protocol/member` and `/protocol/replacements` |
| Team leader CRUD | Create/deactivate on `/protocol/team-leaders` |
| Assign leader to team | Recommended assign on team detail page |

## Sprint 2 — Completed

| Item | Status |
|------|--------|
| President/coordinator ops panel | `ProtocolLeaderOpsPanel` wired to `GET /protocol/dashboard` |
| Rankings generate + categories | `/protocol/rankings` — generate button + 6 category tabs |
| Team-head reports | `ProtocolTeamReportForm` on team-leader hub + reports page team picker |
| Treasury scope | Deferred — hub links to `/church/finance` with explicit notice |

## Sprint 2 — Remaining

| Priority | Item |
|----------|------|
| P2 | Reports CSV export (`GET /protocol/reports/:type/export`) |
| P3 | Settings admin UI (`GET /protocol/settings`) |
| P3 | Dedicated protocol finance module (if needed later) |
| P3 | In-app notifications for protocol events |

---

## Build teams QA (coordinator)

1. Re-seed: `npx prisma db seed` then `npx ts-node prisma/seed-pilot.ts`
2. Log in as `protocol.coordinator@church.local` / `Pilot@123`
3. **Build teams** → pick **Serivisi Protocol — Ukwezi 1** (pilot seeds a published team for team-head QA; pick a *different* occurrence to test build, or open the existing team)
4. Select members (e.g. `member3`, `member4`) → **Build team**
5. Team detail → advance **GENERATED → REVIEWED → APPROVED → PUBLISHED** if still draft

Pilot seed now creates a **PUBLISHED** team for Ukwezi 1 with `protocol.teamhead@church.local` as assigned leader and protocol member profiles for the roster.

## Team head (scoped dashboard)

Team heads (`protocol.teamhead@church.local`) only see **services they lead**:

- **Team leader hub** — next service, upcoming assignments, links to attendance
- **Team replacements** — pending requests for their team only (approve/reject)
- **No** access to all teams, build teams, backups, or coordinator ops in the sidebar

Attendance and replacement review are enforced per-team on the API (not global).

## 5-Step QA (after pilot seed)

| Step | Actor | Action |
|------|-------|--------|
| 1 | Coordinator | `/protocol/teams/generate` for a published occurrence |
| 2 | Coordinator | Team detail → advance status through REVIEWED → APPROVED → PUBLISHED |
| 3 | Team leader | Mark attendance outcomes on team detail |
| 4 | Member | Submit replacement request (when UI exists) or via API |
| 5 | Coordinator | `/protocol/replacements` → approve/reject |

**Pilot accounts:** Use protocol committee roles from `seed-pilot.ts`; password `Pilot@123`.

---

## Key Files

| Layer | Path |
|-------|------|
| API surface | `backend/src/protocol/protocol.controller.ts` |
| Team engine | `backend/src/protocol/protocol-teams.service.ts` |
| Frontend client | `web/lib/api/modules/protocol.ts` |
| Team detail | `web/app/(dashboard)/protocol/teams/[occurrenceId]/page.tsx` |
| Dashboard context | `backend/src/member-portal/protocol-dashboard-context.service.ts` |
| Architecture | `docs/architecture/PROTOCOL_ENGINE.md` |

---

## Next

Settings admin UI, report exports, and notification surfacing.
