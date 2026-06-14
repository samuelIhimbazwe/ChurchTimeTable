# Choir System — Vision vs Current State

This document captures what we **agreed the Choir System should be**, what **exists in the codebase today**, and **what still gaps**. It reflects the portal-first, role-composed model (Elim, Integuza, Beulah, Yerusalemu as separate instances of the same pattern).

Last updated: June 2026 (choir closure sprint complete)

---

## Architecture (Target)

```
CMMS (shared: login, profile, portal, church calendar, member records)
├── Portal                          ← church-life home; entry to subsystems
├── Choir System (×N instances)     ← /choir/{choirId}/…
├── Protocol System                 ← single ministry; same pattern
├── Ministry Systems (Men/Women/Youth) ← scaffold only
└── Church Governance (/church/*)   ← admin oversight, not member subsystem
```

**Per-choir rules we agreed:**

| Principle | Target behavior |
|-----------|-----------------|
| **Instance isolation** | Each choir is its own dashboard context; roles and nav are per `choirId`. |
| **Composed dashboard** | Approved member baseline **+** any committee roles in that choir — not separate products. |
| **Portal-first entry** | Join/browse on `/portal/choirs`; “Open choir dashboard” only when **approved**. |
| **Role landing** | `/choir/{choirId}` → highest-priority role hub (president → … → family head → member). |
| **Membership rules** | One primary choir + Yerusalemu exception; hidden choirs blocked at API and redirected in UI. |
| **Role Hub** | Personalized desk (president, family head, singer, etc.) — **not** an 11th module. |
| **Family Department** | Four sovereign offices (member, head, deputy, secretary) — see [`architecture/FAMILY_DEPARTMENT_SPEC.md`](architecture/FAMILY_DEPARTMENT_SPEC.md) for external reference imports and improvement tiers (S/A/B/C; AI deferred). |

---

## Module Map (11 Modules + Role Hub)

```
Choir System (per choir instance)
├── 1.  Membership
├── 2.  Worship & Music
├── 3.  Spiritual Life
├── 4.  Attendance
├── 5.  Finance
├── 6.  Family Teams
├── 7.  Welfare
├── 8.  Discipline
├── 9.  Communications
├── 10. Reports
├── 11. Assets
└── Role Hub (composed officer desks, not a separate domain)
```

**Split rule:** Worship & Music = songs, rehearsals, scheduling, service execution. Spiritual Life = devotions, intercession, prayer/fasting programs.

---

## Completed Phases (1–5)

| Phase | Focus | Status |
|-------|--------|--------|
| **1 — Stabilize** | Prisma, builds, roster API, attendance choir scoping | **Done** |
| **2 — Scope** | `choirId` through legacy pages; remove `choirs[0]` | **Done** |
| **3 — Family ops** | Family assign UI, effective amounts, member pickers | **Done** |
| **4 — Depth** | Records/advisor depth, assets CRUD, targeted comms | **Done** |
| **5 — New domains** | Service prep, church service requests, dissolution transfers | **Done** |

### Choir admin closure (June 2026)

| Item | Status |
|------|--------|
| **Administration hub** | `/choir/{id}/admin` — joins, roster, families structure, roles, settings |
| **Roster lifecycle** | Assign/revoke committee positions, CSV export, position labels |
| **Family financial privacy** | UI `structure` variant + **backend** per-family contribution metrics |
| **Choir settings** | `/choir/{id}/settings` including family payment instructions |
| **Member service prep** | Read-only card on member hub + member API endpoints |
| **Church nav** | Service requests + choir transfers in church leadership sidebar |

---

## Phase 5 — New Domains

### 1. Service Preparation Center

Per-service preparation desk (not a generic “readiness score”). Leaders build a plan for each assigned church service:

| Item | Description |
|------|-------------|
| **Service date & time** | From `OperationOccurrence` / choir assignment |
| **Service song(s)** | Song(s) the choir will sing (music library link) |
| **Uniform** | What to wear / uniform notes |
| **Pep talk / short meeting** | Optional briefing with scheduled time **before or after** service |
| **Short announcements** | Service-specific comms |
| **Custom items** | Leaders add other prep tasks (arrival time, positions, guests, etc.) |

**Routes:** `/choir/{choirId}/service-preparation` → detail per `occurrenceId`

**API (leaders):** `GET/POST /choir/service-preparation`

**API (members):** `GET /choir/member-service-preparation` — active choir membership required

### 2. Membership transfers (narrow rules)

| Scenario | Allowed? | How |
|----------|----------|-----|
| Member moves primary choir → primary choir on their own | **No** | Blocked by membership rules |
| Family coordinator moves member between **families in same choir** | **Yes** | `/choir/{id}/families` or `/choir/{id}/admin/families` |
| Choir **no longer exists** — all members to one (or distributed) choir | **Yes** | Admin dissolution transfer at `/church/choir-transfers` |

**API:** `POST /choirs/dissolution-transfer`, `GET /choirs/dissolution-transfers`

### 3. Church service requests

Church/governance requests choir presence for a published service occurrence. On approval → `ChoirServiceAssignment` + linked `ChoirActivity`.

**Routes:** `/church/service-requests` (linked from church leadership nav)

**API:** `GET/POST /church/service-requests`, `POST …/review` (approve/reject)

**Flow:** Request → review (president/scheduler) → assign choir → visible in scheduling + Service Preparation Center

---

## Family financial privacy

Presidents and other officers with `choir.finance.view` can see **family structure** (roster, transfers, health grades without contribution weight) but **not** other families’ contribution totals unless:

- They belong to that family, **or**
- They hold `choir.family.manage` (family coordinator) or `choir.finance.manage` (treasurer)

Enforced in `FamilyAdminPanel` (`structure` variant) and `FamilyMetricsService` via `canViewFamilyContributionMetrics`.

---

## Module-by-Module: Want vs Current

| # | Module | Current status | Remaining gap |
|---|--------|----------------|---------------|
| **1** | **Membership** | Join, roster API, position assign/revoke, dissolution transfer | Roster deactivate — **done**; member-initiated choir transfer N/A by design |
| **2** | **Worship & Music** | Music, rehearsals, scheduling, service prep (leader + member read-only) | Minor UI polish only |
| **6** | **Family Teams** | My family, payment, coordinator, families admin, privacy-safe structure view | — |
| **9** | **Communications** | Targeted choir announcements, delivery/read stats on announcements page | — |
| **10** | **Reports** | Unified health score, module snapshot, health-pack PDF export | — |
| **11** | **Assets** | Uniform/equipment CRUD, maintenance logs UI | — |

---

## Key Flows

### Church service → preparation (5-step QA)

Run with API `http://localhost:3000/api/v1`, web `http://localhost:3001`, SQLite pilot data (`use-local-dev.ps1 -WithPilotAccounts`).

| Step | Actor | Action | Expected |
|------|-------|--------|----------|
| **1** | Church admin (`admin@church.local` / `Admin@123`) | Church nav → **Service Requests** → create request for a published service occurrence | Request status `PENDING` |
| **2** | President (`choir.president@church.local` / `Pilot@123`) | Approve request (or scheduling hub) → choir assigned | `ChoirServiceAssignment` created; appears in scheduling |
| **3** | Music director (`choir.rehearsal@church.local`) | `/choir/{id}/service-preparation` → open service → add songs, uniform, pep talk → save | Plan status “ready” |
| **4** | Any choir member (`choir.member@church.local` or similar pilot) | Member hub → **Upcoming service prep** card → open detail | Read-only uniform, songs, pep talk (no edit controls) |
| **5** | Church admin | **Choir Transfers** → preview dissolution (do not execute on pilot unless testing) | Preview shows member/family counts |

**Admin hub QA (president):**

1. `/choir/{id}/admin` — all cards visible per permissions
2. Roster → assign/revoke position → CSV export
3. `/choir/{id}/admin/families` — structure only (no other families’ contribution totals)
4. `/choir/{id}/settings` — family payment instructions save

### Choir dissolution

1. Admin selects closing choir + receiving choir — **Done**
2. All active memberships + families move — **Done**
3. Source choir `isActive = false` — **Done**

### Family contribution (umusanzu)

Full workflow **Done**; effective amounts in officer views **Done** (Phase 3–4). Privacy rules **Done** (closure sprint).

---

## Pilot Accounts (QA)

Password: `Pilot@123` (church admin: `Admin@123`)

| Persona | Email | QA focus |
|---------|-------|----------|
| Church admin | `admin@church.local` | Service requests, dissolution, church nav |
| President | `choir.president@church.local` | Approve requests, prep center, admin hub |
| Music director | `choir.rehearsal@church.local` | Service songs in prep plan |
| Family coordinator | `choir.family@church.local` | Intra-choir family moves; sees all family contributions |
| Choir member | any approved pilot member | Member hub service prep card |

---

## Key File Index

**Phase 5 backend:** `choir-service-ops/*`, `choir-scheduling/choir-service-assignments.service.ts`

**Phase 5 frontend:** `web/app/(dashboard)/church/service-requests/`, `web/app/(dashboard)/choir/service-preparation/`, `web/app/(dashboard)/church/choir-transfers/`, `web/lib/api/modules/choirServiceOps.ts`

**Admin closure:** `web/components/choir/ChoirAdminHub.tsx`, `ChoirRosterActions.tsx`, `ChoirSettingsPanel.tsx`, `MemberServicePrepCard.tsx`, `backend/src/families/family-metrics.service.ts`

**Schema:** `ChurchServiceRequest`, `ServicePreparationPlan`, `ServicePreparationItem`, `ChoirDissolutionTransfer`

---

## Choir system closure — complete (June 2026)

All 11 modules and committee executive waves (C1–C4) are shipped for pilot. Remaining work is **Protocol** (see `docs/PROTOCOL_SYSTEM_STATUS.md`) and explicitly deferred items (C19 AI summaries, full mobile rebuild, member lifecycle RFC).

**Deferred (not blocking protocol):** mobile rebuild polish; member lifecycle RFC (Visitor→Deceased enum expansion).
