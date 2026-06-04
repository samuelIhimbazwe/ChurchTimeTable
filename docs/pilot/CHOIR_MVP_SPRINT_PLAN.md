# Choir MVP — Implementation Plan (Post 10.3.3)

**Goal:** Production-ready choir operating system before Protocol module.

## Phase 0 — Foundation (started)

| Item | Status |
|------|--------|
| Prisma schema: member lifecycle, welfare, music, rehearsal, announcements, documents, meetings, uniform, equipment | ✅ |
| Migration `20260601140000_choir_mvp_foundation` | ✅ (run `npx prisma migrate deploy`) |
| MemberStatus remap: PENDING→NEW_MEMBER, INACTIVE→TEMPORARILY_INACTIVE, ALUMNI→GRADUATED | ✅ |
| RBAC permissions `choir.welfare.*`, `choir.music.*`, etc. | ✅ seed |
| Welfare API `/api/v1/choir/welfare/*` | ✅ |
| Music API `/api/v1/choir/music/*` (read) | ✅ |
| Rehearsal API `/api/v1/choir/rehearsals/*` | ✅ |
| Sprint 10 contribution rules | 🔒 unchanged |

## Phase 1 — Member profile + unified timeline ✅

| Item | Status |
|------|--------|
| `GET /members/:id/profile` — profile center dashboard | ✅ |
| `GET /members/:id/timeline` — unified chronological feed (attendance, contributions, welfare, leadership, discipline, rehearsals, assignments, announcements, status) | ✅ |
| `GET /members/:id/attendance`, `/contributions`, `/welfare-cases`, `/status-history` | ✅ |
| `PATCH /members/:id/profile` — extended profile + voice section | ✅ |
| Access: self, `member:manage`/`read`, exec contributions, family leadership, family contribution viewers | ✅ |
| Discipline + welfare visibility gated by permission | ✅ |
| Web `/dashboard/members/[id]` — full tabs + edit form + status panel | ✅ |
| Members directory → profile link + updated status filters | ✅ |
| i18n en/fr/rw for `memberProfile` | ✅ |
| Status transition UI with reason + history (admin) | ✅ |
| Mobile profile screen + my profile route | ✅ |
| Unit + e2e tests (`member-profile-access.service.spec`, `member-profile.e2e-spec`) | ✅ |

## Phase 2 — Welfare web + mobile (in progress)

| Item | Status |
|------|--------|
| Extended welfare schema (amounts, timeline, anonymous contributions) | ✅ |
| Welfare API: timeline, CSV export, member contributions, category upsert | ✅ |
| Controller RBAC guards | ✅ |
| Web `/dashboard/welfare` dashboard + case list | ✅ |
| Mobile welfare screens | 🔲 |
| Welfare notifications (de-duplicated) | 🔲 |
| PDF export | 🔲 |

## Phase 3 — Music + rehearsals web + mobile (in progress)

| Item | Status |
|------|--------|
| Music CRUD, assets, favorites, analytics | ✅ |
| Rehearsal sections, attendance, readiness dashboard | ✅ |
| `choir.rehearsal.view` permission + member browse | ✅ |
| Web `/dashboard/music`, `/dashboard/rehearsals` | ✅ |
| Song upload via receipt storage pattern | 🔲 |
| Rehearsal plan editor on event detail | 🔲 |
| Mobile music + rehearsal screens | 🔲 |

## Phase 4 — Communication + documents + meetings

- Announcements with audience targeting + read receipts
- Document repository with versions
- Meetings: agenda, minutes, action items

## Phase 5 — Uniform + equipment + reporting center

- Inventory CRUD + assignments
- Unified `/choir/reports` PDF/CSV export pack
- Role dashboards (President, Treasurer, Coordinator)

## Phase 6 — Go-live

- Full i18n (en/fr/rw) for all new modules
- Playwright choir-mvp suite
- Pilot sign-off on [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)

**Protocol module:** Blocked until Phase 6 sign-off.
