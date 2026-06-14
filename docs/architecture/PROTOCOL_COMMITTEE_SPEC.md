# Protocol Committee — Product Specification

Enterprise-grade specification for the **Protocol ministry officer layer**: president, coordinator, team leader, treasurer, secretary, VP, and ministry admin.

**Related:** [`PROTOCOL_SYSTEM_STATUS.md`](../PROTOCOL_SYSTEM_STATUS.md) · [`PROTOCOL_ENGINE.md`](PROTOCOL_ENGINE.md) · [`COMMITTEE_POSITIONS_SPEC.md`](COMMITTEE_POSITIONS_SPEC.md) (choir parallel) · [`PRESIDENT_DECISION_CONSOLE_SPEC.md`](PRESIDENT_DECISION_CONSOLE_SPEC.md)

Last updated: June 2026

---

## 1. North star

Protocol is a **single ministry** — officers work on **whole-ministry scope**, not per-family or per-choir instances.

| Principle | Target behavior |
|-----------|-----------------|
| **Sovereign offices** | Each officer enters their desk — president ≠ coordinator ≠ team head |
| **Occurrence teams** | Primary unit is `ProtocolOccurrenceTeam` per church service occurrence |
| **Closed membership** | Invitations + claims only — no open self-join |
| **Workflow-first ops** | Replacements, claims, team publish = **queues with state** |
| **One primary work surface** | Split queue console per queue — not card stacks |
| **Scoped team heads** | Team leaders see only teams they lead |

### Officer routes (canonical)

| Role | Hub path | North star |
|------|----------|------------|
| President / Leader | `/protocol/president` | What needs my decision today — claims, replacements, publish backlog |
| Coordinator | `/protocol/coordinator` | Build teams, publish rosters, clear substitution queues |
| Team leader | `/protocol/team-leader` | My next service, attendance, scoped replacements |
| Treasurer | `/protocol/treasury` | Confirm protocol unity contributions |
| Vice President | `/protocol/vice-president` | Oversight read — contributions + operations |
| Secretary | `/protocol/secretary` | Reports register and operational exports |
| Ministry admin | `/protocol/admin` | Roles, invitations, claims (operational admin) |

President ≡ Protocol Leader (naming only).

---

## 2. External import map (reference stack)

Borrow **patterns**, not visual clones:

| Layer | Reference product | Use for Protocol |
|-------|-------------------|------------------|
| Executive console | Salesforce Service Console | Replacements, claims, publish queues |
| Approvals | Microsoft Power Automate | Approve/reject with audit + notifications |
| Mobile | SAP Fiori list–detail | Queue → detail → action |
| Role homes | Infor OS Workspace | 3-widget command homes |
| Ministry health | Microsoft Viva Insights | Aggregated KPIs (Phase 4) |
| Stewardship | SAP FI / Blackbaud scoped inbox | Protocol unity contributions |
| Scheduling spine | Church MF-7 operations engine | Occurrence-based teams |

**Not references:** Choir Family Department ESS/MSS, social-feed dashboards, link-only hub grids.

---

## 3. Implementation waves (closure order)

| Wave | Focus | Status |
|------|--------|--------|
| **P0** | Docs truth + `PROTOCOL_MODULE_COMPLETION.md` | **Done** |
| **P1** | Shared `SplitQueueConsole` + `OfficeCommandHome` | **Done** (June 2026) |
| **P2** | Replacements, claims, publish consoles | **Done** (June 2026) |
| **P3** | President + coordinator command homes | **Done** (June 2026) |
| **P4** | Officer SLA + ministry health pack | **Done** (June 2026) |
| **P5** | Treasury depth, secretary desk, member 360 | **Done** (June 2026) |
| **P6** | MF documents, import center, calendar tie-in | **Done** (June 2026) |
| **P7** | Mobile parity + pilot gate | **Done** (June 2026) |

---

## 4. Key files

| Layer | Path |
|-------|------|
| Consoles | `web/components/protocol/Protocol*Console.tsx` |
| Command homes | `ProtocolPresidentCommandHome.tsx`, `ProtocolCoordinatorCommandHome.tsx` |
| Shared office UX | `web/components/shared/office/SplitQueueConsole.tsx`, `OfficeCommandHome.tsx` |
| API | `backend/src/protocol/protocol.controller.ts` |
| Dashboard | `backend/src/protocol/protocol-dashboard.service.ts` |
