# Choir System — Vision vs Current State

This document captures what we **agreed the Choir System should be**, what **exists in the codebase today**, and **what still gaps**. It reflects the portal-first, role-composed model (Elim, Integuza, Beulah, Yerusalemu as separate instances of the same pattern).

Last updated: June 2026

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

## Module-by-Module: Want vs Current

| # | Module | What we want | Current status | Gap |
|---|--------|--------------|----------------|-----|
| **1** | **Membership** | Join requests, roster, committee roles, transfers, multi-choir rules (Yerusalemu), scoped to active choir | **Partial–Real** — join workflow, role assignment, dashboard context, portal rules all work | Roster page calls `GET /choirs/:id/members` but **no backend route**; many pages still use **first choir** instead of URL `choirId`; **membership transfers** not built |
| **2** | **Worship & Music** | Song library, voice sections, rehearsals, music director notifications, service readiness | **Real** — music, voice sections, music-direction hub, `MusicSongNotifyForm`, scheduling/rehearsals | **Service Readiness Center** (pre-service checklist, assignments) **not built**; church **service request** flow **not built** |
| **3** | **Spiritual Life** | Devotions, intercession inbox, prayer programs separate from music ops | **Real** — spiritual hub, intercessor inbox, devotion publish, portal devotion center | **Member development / spiritual growth tracking** not built; some devotions still portal-level |
| **4** | **Attendance** | Family-head marks team; coordinator/president sees health; tied to activities | **Partial–Real** — backend scheduling + attendance APIs exist; family-head links to mark team | Attendance UI uses **`'default'` choir id** and broken member list API; not fully choir-scoped |
| **5** | **Finance** | Family MoMo/bank → pay outside → claim → family head confirm/partial → treasurer adjust → rankings | **Real (strongest slice)** — full backend workflow + UI components | Portal `/portal/contributions` not choir-scoped URL; **campaign UX** thin |
| **6** | **Family Teams** | Every member sees **My family**; head sets payment details; coordinator manages all families | **Real for core flow** — `my-family` page, payment settings, inbox, coordinator hub | **`/families` admin** is read-only (no assign UI) |
| **7** | **Welfare** | Cases, assistance, escalation from family head | **Real** — welfare API + pages + care hub tab | UX uses raw member IDs, not member picker |
| **8** | **Discipline** | Case lifecycle, rules, care integration | **Real** — discipline API + care hub | Same manual ID entry; no member-facing discipline view |
| **9** | **Communications** | Announcements, targeted broadcasts, public profile, documents | **Partial–Real** — announcements, public profile edit, care notices | **Targeted broadcasts** (by family, voice section, role) **not built** |
| **10** | **Reports** | Participation, finance, family health, exports | **Partial–Real** — summary PDF/CSV, analytics, leader dashboard | Records hub is mostly **link shell** |
| **11** | **Assets** | Uniforms, equipment, inventory lifecycle | **Partial** — read dashboards for uniforms/equipment | **View-only**; no create/edit/issue workflow in UI |
| — | **Role Hub** | One desk per persona: member home + officer tabs filtered by permissions | **Real structure** — 10 officer hubs + member home + composed sidebar | Hubs vary in depth; many internal links still **legacy `/choir/…`** |

---

## Persona Journeys: Want vs Current

### Shared entry (every persona)

| Step | Target | Current |
|------|--------|---------|
| Login → Portal | Church-life home first | **Done** |
| Browse/join choirs | Rules on primary + Yerusalemu | **Done** |
| Open choir dashboard | Only when approved | **Done** |
| Land on role hub | `landingPath` from dashboard context | **Done** |
| Sidebar | Participate + My roles + Admin + Operations | **Done** |
| Banner | Choir name + committee titles | **Done** |

### Regular singer

| Want | Current |
|------|---------|
| Land on `/choir/{id}/member` | **Done** |
| My family → payment details → pay contribution | **Done** |
| Music, activities, announcements from Participate nav | **Done** |
| Never see officer/admin tools | **Done** |

### Family head

| Want | Current |
|------|---------|
| Family-scoped desk | **Done** |
| Set MoMo/bank for family | **Done** |
| Review claims: confirm / partial / reject | **Done** |
| Mark team attendance | **Partial** — attendance page has API/id issues |

### Family coordinator / Treasurer / President

See module table above. Coordinator and treasurer have treasury/discrepancy panels; president hub is rich but often scoped to first choir.

---

## Key Flows

### Family contribution (umusanzu)

1. Member sees family MoMo/bank (family head controlled) — **Done**
2. Select type including Other with free text — **Done**
3. Pay outside system — **Done**
4. Submit claim — **Done**
5. Family head confirm / partial / reject — **Done**
6. Mismatch → notify coordinator + treasurer — **Done** (backend)
7. Treasurer manual adjust + audit — **Done**
8. Effective amounts in all officer views — **Partial**

### Routing

- Legacy `/choir/*` → `/choir/{primaryId}/*` — **Done**
- `/choir/{id}` → role `landingPath` — **Done**
- Page logic uses URL `choirId` everywhere — **Gap**

---

## Cross-Cutting Gaps

### P0 — Breaks real use

1. Missing roster API — `choirApi.getMembers` has no controller route
2. First-choir bias — executive pages use `choirApi.getAll()[0]`
3. Attendance hardcoded `'default'` choir id
4. Prisma client / migration for family payment columns

### P1 — Vision completeness

5. Full choir scoping in all legacy pages
6. Families admin UI (assign heads, move members)
7. Effective contribution amounts everywhere
8. Member picker in welfare/discipline forms
9. Richer records / advisor hubs

### P2 — Future modules

| Feature | Status |
|---------|--------|
| Service Readiness Center | Not started |
| Church service requests | Not started |
| Membership transfers | Not started |
| Targeted broadcasts | Not started |
| Member development tracking | Not started |
| Asset issue/return workflow | Not started |

---

## Recommended Phases

| Phase | Focus |
|-------|--------|
| **Phase 1 — Stabilize** | Prisma migrate/generate, builds green, roster API, fix attendance choir id |
| **Phase 2 — Scope** | Pass `choirId` through all legacy pages; remove `choirs[0]` pattern |
| **Phase 3 — Family ops** | Family assign UI, effective amounts, member pickers |
| **Phase 4 — Depth** | Records, advisor, assets CRUD, targeted comms |
| **Phase 5 — New domains** | Service Readiness, transfers, service requests |

---

## Pilot Accounts (QA)

Password: `Pilot@123` (pilot seed)

| Persona | Email |
|---------|-------|
| Regular singer | `member1@church.local`, `choir.singer@church.local` |
| Family head | `choir.familyhead@church.local` |
| Family coordinator | `choir.family@church.local` |
| Treasurer | `choir.treasurer@church.local` |
| President | `choir.president@church.local` |

---

## Key File Index

**Backend:** `member-portal/choir-dashboard-context.service.ts`, `choir-my-family.service.ts`, `finance/contribution-*.service.ts`, `families/families.service.ts`, `choirs/choirs.controller.ts`

**Frontend:** `web/lib/navigation/choir-nav.ts`, `web/lib/choir/paths.ts`, `web/app/(dashboard)/choir/[choirId]/`, `web/components/choir/*`
