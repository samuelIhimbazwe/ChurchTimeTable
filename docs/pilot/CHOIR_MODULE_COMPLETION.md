# Choir Module — Pre-Launch Completion Tracker

**Purpose:** Single source of truth for choir MVP readiness before Protocol module work begins.  
**Architecture rule:** Ministry-agnostic foundations (members, events, attendance, finance patterns, RBAC, audit) stay reusable; choir-specific UX and catalogs sit on top.

**Legend:** ✅ Production-ready · 🟡 Operational but incomplete · 🔴 Not started · 🔒 Frozen (do not change rules)

---

## MVP acceptance criteria (your gate)

| Criterion | Status | Notes |
|-----------|--------|-------|
| Choir operations fully inside CMMS | ✅ | Core ops, welfare, music, assets, meetings scaffold, executive layer |
| Attendance operational | ✅ | Web + mobile; scoring, excuses, escalations |
| Rehearsals operational | ✅ | Scheduling module, rehearsal analytics, service prep |
| Song management operational | ✅ | Music library schema + UI |
| Welfare operational | ✅ | Welfare cases, care desk, contributions link |
| Contributions operational | ✅ | Sprint 10.2 backend 🔒; 10.3.x web UI + quick actions |
| Leadership governance operational | ✅ | Families, leadership history, family workspace, executive stewardship |
| Uniform tracking operational | ✅ | Assets module + uniform contribution type |
| Communication operational | ✅ | Targeted announcements + delivery stats |
| Meeting governance operational | 🟡 | Meetings pages scaffold; full agenda/minutes depth optional |
| Reporting operational | ✅ | Health score + export pack, contribution rankings, finance export |
| Mobile / web parity acceptable | 🟡 | List–detail on key family offices; executive stewardship read-only on mobile |
| Pilot church without external tools | 🟡 | Sunday workflow yes; deep meeting minutes still light |

**Verdict today:** Choir **pilot-ready** for Elim-style operations. Protocol module **pilot-ready** — see [PROTOCOL_MODULE_COMPLETION.md](./PROTOCOL_MODULE_COMPLETION.md).

---

## Domain scorecard

### 1. Membership & lifecycle — 🟡

| Requirement | Status |
|---------------|--------|
| Statuses: Visitor, Candidate, Probation, Active, Suspended, Inactive, Alumni, Transferred, Deceased | **Partial:** `PENDING`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `ALUMNI` only |
| Join / approval dates, baptism, mentor, section, skills, instruments, availability | **Missing** on `Member` model |
| Emergency contacts (beyond phone) | **Missing** |
| Phone required (operational) | ✅ Phone enforcement guard |
| Member profile timeline (unified) | **Partial:** contributions timeline, audit; no single “life story” UI |

**Next:** Extend `MemberStatus` enum + migration; `MemberProfileExtension` table (mentor, section, skills JSON); timeline aggregator API.

---

### 2. Families & leadership — ✅ / 🟡

| Requirement | Status |
|---------------|--------|
| Sprint 10 governance (approve once, immutable amounts) | 🔒 ✅ |
| Family profile, CRUD, members, roles | ✅ |
| Family health / attendance / contribution scores | ✅ `FamilyMetricsService` |
| Welfare history on family | 🔴 (depends on welfare module) |
| Head / Assistant / Secretary + delegation | ✅ |
| Tenure history, no rewrite | ✅ `FamilyLeadershipHistory` |
| Web family workspace (10.3.2) | ✅ |
| Leadership history viewer (10.3.4 planned) | 🟡 API exists; admin UI pending |

---

### 3. Attendance — ✅ / 🟡

| Requirement | Status |
|---------------|--------|
| Present / Late / Excused / Absent (operational statuses) | ✅ |
| Service vs rehearsal *separation in reporting* | 🟡 Same engine; filter by `EventType` (REHEARSAL vs CHOIR_SERVICE) — not separate product surfaces |
| Reliability score, consecutive absences | ✅ Scoring service |
| Family attendance trends | ✅ Via family metrics |
| Web + mobile marking | ✅ |

**Next:** Explicit “Service attendance” vs “Rehearsal attendance” dashboards (filtered views, not new backend).

---

### 4. Events & scheduling — ✅ / 🟡

| Requirement | Status |
|---------------|--------|
| Event types (service, rehearsal, concert, etc.) | ✅ `EventType` enum |
| Recurrence metadata | 🟡 JSON metadata on events |
| Assignments, conflict detection | ✅ |
| Capacity, transport requirements | 🔴 |
| Web event engine + mobile calendar | ✅ |

---

### 5. Contributions & stewardship — ✅ 🔒

| Requirement | Status |
|---------------|--------|
| Submit → family approve → ledger | 🔒 ✅ Sprint 10.2 |
| Adjustment governance | 🔒 ✅ |
| Member center (10.3.1) | ✅ Web |
| Family workspace (10.3.2) | ✅ Web |
| Executive stewardship (10.3.3) | ✅ Web |
| Campaign intelligence (historical compare, success rate) | 🟡 Totals/rankings exist; historical compare UI not built |
| Family/member contribution *trend* charts | 🟡 Data via totals + date range; charts pending |

**Do not mutate:** `claimedAmount`, `confirmedAmount`, ledger amount on approve.

**Next:** 10.3.4 admin (catalog, campaigns, leadership history viewer).

---

### 6. Welfare — 🔴

No `WelfareCase`, fund ledger, or disbursement workflow in schema.

**Recommended:** New ministry-scoped module mirroring contribution patterns (immutable approved amounts, adjustment-style corrections, audit).

---

### 7. Music & song management — 🔴

No song library, attachments, or performance history.

---

### 8. Rehearsal management — 🔴 / 🟡

| Requirement | Status |
|---------------|--------|
| Rehearsal as event type | ✅ |
| Rehearsal plans, songs practiced, notes, action items | 🔴 |
| Section rehearsals | 🟡 Events + assignments can model; no section entity |

---

### 9. Uniform management — 🔴

Contribution type `uniform` only — not inventory, sizes, issue/return.

---

### 10. Equipment & assets — 🔴

No asset register, maintenance, or assignment tracking.

---

### 11. Communication — 🟡

| Requirement | Status |
|---------------|--------|
| In-app notifications | ✅ |
| FCM push | ✅ |
| SMS (thank-you on contributions) | ✅ |
| Announcements with choir/family/section targeting | 🟡 Partial via notification types; no full campaign composer |
| Delivered / read tracking | 🟡 |

---

### 12. Meetings & governance — 🔴

No meeting, agenda, minutes, or action-item entities.

---

### 13. Discipline & restoration — 🟡

| Requirement | Status |
|---------------|--------|
| Case workflow | ✅ Stages: REPORTED → … → CLOSED |
| Restoration-focused stages (Restoration, Reintegration date) | 🔴 Stages lack RESTORATION; no restoration plan entity |
| Web + mobile screens | 🟡 Basic |

**Next:** Add `RESTORATION` stage + `restorationPlan`, `reintegrationAt` fields without rewriting closed cases.

---

### 14. Leadership terms & elections — 🟡

| Requirement | Status |
|---------------|--------|
| Family leadership tenure | ✅ `FamilyLeadershipHistory` |
| Choir officer elections / term dates | 🔴 Officer roles are CMMS roles, not termed records |
| Succession without history rewrite | ✅ Principle documented in SPRINT_10.md |

**Next:** `LeadershipTerm` table for choir officers (President, VP, etc.) linked to `UserRole` assignments.

---

### 15. Reporting & analytics — 🟡

| Layer | Status |
|-------|--------|
| Executive contribution intelligence | ✅ 10.3.3 |
| Family rankings / health | ✅ |
| Member personal dashboard | ✅ |
| Finance CSV/PDF export | ✅ |
| Unified “choir health score” + export pack | ✅ |
| Welfare analytics | 🔴 (blocked) |

---

### 16. File & document management — 🔴

Receipt upload on contributions only. No policy/constitution/minutes library with versioning.

---

## Recommended completion phases (post 10.3.4)

| Phase | Focus | Unlocks |
|-------|--------|---------|
| **P0 — Lock & pilot** | 10.3.4 admin UI, i18n fr/rw for 10.3.x, mobile parity for contributions + stewardship read-only, go-live checklist | Real church pilot on Sunday workflow + contributions |
| **P1 — Membership depth** | Full lifecycle statuses, profile extensions, unified member timeline | Pastoral onboarding without spreadsheets |
| **P2 — Rehearsal + attendance UX** | Rehearsal plans (link songs later), service/rehearsal reporting split | Rehearsal director daily use |
| **P3 — Welfare** | Cases, fund ledger, campaigns for cases | Replace WhatsApp welfare tracking |
| **P4 — Assets & ops** | Uniform inventory, equipment register, meetings, documents | Full “no external tools” MVP |

**Protocol module start:** Only after P0 complete **and** pilot sign-off on [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) (≥28/40) **and** explicit waiver or completion of P1–P2 if church requires them.

---

## What is already production-grade (do not regress)

- RBAC + church admin separation + visibility enforcement
- Contribution governance (Sprint 10.2 E2E: 96 tests)
- Attendance operational pipeline + offline sync (mobile)
- Events, assignments, swaps, replacements, coverage
- Families + metrics + leadership history
- Audit log on sensitive actions
- Search, dashboard widgets, phone enforcement

---

## Immediate next engineering steps

1. **Finish Sprint 10.3.4** — catalog/campaign admin, leadership history viewer ([API_CONTRACT](./API_CONTRACT_CONTRIBUTIONS_v1.md)).
2. **Mobile parity** — family workspace + executive stewardship (read-only minimum).
3. **Pilot runbook** — map real church roles to pilot accounts; run [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) (choir + protocol sections).
4. **Spike welfare domain** — schema + workflow design doc before implementation (ministry-agnostic pattern).
5. **Member lifecycle RFC** — enum migration plan for Visitor → Deceased without breaking ACTIVE/PENDING flows.

---

## References

| Doc | Content |
|-----|---------|
| [SPRINT_10.md](./SPRINT_10.md) | Contribution + family governance lock |
| [SPRINT_10_2.md](./SPRINT_10_2.md) | Backend sign-off |
| [SPRINT_10_3_2.md](./SPRINT_10_3_2.md) | Family workspace |
| [SPRINT_10_3_3.md](./SPRINT_10_3_3.md) | Executive stewardship |
| [GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md) | Pilot gate (40-point) |
| [ACCOUNTS.md](./ACCOUNTS.md) | Pilot logins |

---

*Last updated: aligned with codebase through Sprint 10.3.3 web delivery.*
