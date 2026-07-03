# Protocol System — Vision vs Current State

Last updated: June 2026 (closure waves P1–P7)

---

## Architecture

Protocol is a **single ministry** using the portal-first, role-composed pattern:

```
Portal → /portal/protocol
Protocol dashboard → /protocol
├── Member hub        — stats, invitations, replacement requests
├── Officer hubs      — president, coordinator, secretary, treasury, team-leader, admin
├── Teams engine      — ProtocolOccurrenceTeam per MF-7 occurrence
├── Attendance        — outcomes → profiles → rankings
├── Replacements      — self-found substitution workflow
├── Rankings          — monthly multi-category + badges
├── Claims/Invites    — closed membership
├── Treasury          — protocol unity contributions (scoped)
└── Reports/Backups   — team reports + operational CSV exports
```

**Onboarding:** [`PROTOCOL_DISCOVERY.md`](PROTOCOL_DISCOVERY.md) — invitations + claims only.

**Officer spec:** [`architecture/PROTOCOL_COMMITTEE_SPEC.md`](architecture/PROTOCOL_COMMITTEE_SPEC.md)

---

## Module map — status

| # | Module | Status | Gap |
|---|--------|--------|-----|
| 1 | Membership | ✅ | Roster search/filter, 360° tabs, invite modal, status badges |
| 2 | Teams | ✅ | Calendar picker, drag builder, auto-generate on generate page |
| 3 | Attendance | ✅ | Bulk-mark chips, quota bar on 360 profile |
| 4 | Replacements | ✅ | Kanban view, pending banner, backup availability |
| 5 | Rankings | ✅ | Generate + categories |
| 6 | Team leaders | ✅ | CRUD + assign on team detail |
| 7 | Treasury | ✅ | Financial summary dashboard + exports |
| 8 | Reports | ✅ | Health charts, KPI drill-down, health pack PDF |
| 9 | Admin / settings | ✅ | Admin hub + engine settings |
| 10 | Communications | ✅ | Composer + SMS/WhatsApp + log at `/protocol/communications` |
| 11 | Portal | ✅ | Stats + contributions |
| 12 | Documents | ✅ | Upload modal, category tabs, preview pane |

---

## Closure waves (June 2026)

### P1–P3 — Shipped

| Item | Path / component |
|------|------------------|
| Replacements console | `ProtocolReplacementsConsole` → `/protocol/replacements` |
| Claims console | `ProtocolClaimsConsole` → `/protocol/claims` |
| Publish queue | `ProtocolTeamPublishConsole` → `/protocol/teams` |
| President command home | `ProtocolPresidentCommandHome` → `/protocol/president` |
| Coordinator command home | `ProtocolCoordinatorCommandHome` → `/protocol/coordinator` |
| Notification links | `protocol_claim_review`, `protocol_invitation` in `links.ts` |

### P4 — Shipped

| Item | Path / API |
|------|------------|
| Officer SLA | `GET /protocol/dashboard/officer-sla` + `ProtocolOfficerSlaPanel` |
| Ministry health | `GET /protocol/reports/health` |
| Health pack PDF | `GET /protocol/reports/health-pack.pdf` |
| Reports UI | Health tiles + export on `/protocol/reports` |

### P5 — Shipped

| Item | Path / API |
|------|------------|
| Secretary command home | `ProtocolSecretaryCommandHome` → `/protocol/secretary` |
| Team reports register | `ProtocolSecretaryRegisterPanel` |
| Member roster + 360 | `ProtocolMemberRosterPanel`, `GET /protocol/members/:id/attendance` |
| Treasury exports | `ProtocolTreasuryExportsCard` + `/finance/export/*?ministryScope=PROTOCOL` |

### P6 — Shipped

| Item | Path / API |
|------|------------|
| Ministry documents | `GET /protocol/documents` + `ProtocolDocumentsShelf` → `/protocol/documents` |
| Import Center | `/admin/import` — preview/confirm via `/imports` (`PROTOCOL_MEMBERS`) |
| MF-7 calendar tie-in | Church calendar link + occurrence card on `/protocol/teams/generate` |

### P7 — Shipped

| Item | Path |
|------|------|
| Pilot runbook | `docs/pilot/PILOT_RUNBOOK.md` — protocol web + mobile Sunday flow |
| Mobile parity | `ProtocolScreen` assignment detail; `ProtocolReplacementScreen` |
| Completion gate | `PROTOCOL_MODULE_COMPLETION.md` P6–P7 checked |

**Deferred:** Dedicated protocol ERP module, legacy monthly team removal, AI summaries.

---

## Pilot QA

Password: `Pilot@123`

| Persona | Email | Focus |
|---------|-------|-------|
| President | `protocol.leader@church.local` | Command home, claims, rankings |
| Coordinator | `protocol.coordinator@church.local` | Build teams, publish queue |
| Team head | `protocol.teamhead@church.local` | Attendance, scoped replacements |
| Treasurer | `protocol.treasurer@church.local` | Unity contribution inbox |

See [`pilot/PROTOCOL_MODULE_COMPLETION.md`](pilot/PROTOCOL_MODULE_COMPLETION.md) for the full gate.

---

## Key files

| Layer | Path |
|-------|------|
| API | `backend/src/protocol/protocol.controller.ts` |
| Dashboard | `backend/src/protocol/protocol-dashboard.service.ts` |
| Web client | `web/lib/api/modules/protocol.ts` |
| Consoles | `web/components/protocol/Protocol*Console.tsx` |
| Architecture | `docs/architecture/PROTOCOL_ENGINE.md` |
