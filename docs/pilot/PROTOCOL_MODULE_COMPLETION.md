# Protocol Module — Pre-Launch Completion Tracker

**Purpose:** Single source of truth for protocol ministry readiness.  
**Architecture rule:** Reuse CMMS foundations (MF-7 operations, finance stewardship, RBAC, audit); protocol-specific UX on top.

**Legend:** ✅ Production-ready · 🟡 Operational but incomplete · 🔴 Not started

---

## MVP acceptance criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Protocol ops inside CMMS | ✅ | Teams, consoles, command homes, health pack |
| Closed membership | ✅ | Invitations + claims; no open join |
| Team generation & publish | ✅ | Generate page + publish console |
| Attendance outcomes | ✅ | Team detail + API |
| Rankings & badges | ✅ | Generate + category tabs |
| Replacements workflow | ✅ | Web console + mobile request flow |
| Treasury (unity contributions) | 🟡 | Scoped inbox + exports; not full finance module |
| Ministry health + export pack | ✅ | Health score + PDF on reports page |
| Officer command homes | ✅ | President, coordinator, secretary + SLA |
| Mobile parity | 🟡 | Dashboard, contribute, treasury, replacements |
| Pilot without external tools | ✅ | Runbook + Import Center wired |

**Verdict today:** **Pilot-ready** — optional polish (shared treasury inbox component, notification deep-link tweaks).

---

## Wave checklist

| Wave | Item | Status |
|------|------|--------|
| P0 | `PROTOCOL_SYSTEM_STATUS.md` accurate | ✅ |
| P0 | `PROTOCOL_COMMITTEE_SPEC.md` | ✅ |
| P0 | `PROTOCOL_MODULE_COMPLETION.md` | ✅ |
| P1 | Shared office components | ✅ |
| P2 | Replacements console | ✅ |
| P2 | Claims console | ✅ |
| P2 | Team publish console | ✅ |
| P3 | President command home | ✅ |
| P3 | Coordinator command home | ✅ |
| P4 | Officer SLA panel | ✅ |
| P4 | Health score + health-pack PDF | ✅ |
| P5 | Secretary progress desk | ✅ |
| P5 | Treasury exports + member 360 | ✅ |
| P6 | Ministry documents shelf | ✅ |
| P6 | Import Center (`PROTOCOL_MEMBERS`) | ✅ |
| P6 | Calendar tie-in on team build | ✅ |
| P7 | Pilot runbook protocol section | ✅ |
| P7 | Mobile replacement + assignment detail | ✅ |
| Polish | Assignment notification deep-link (`occurrenceId`) | ✅ |
| Polish | Shared `MinistryContributionPendingInbox` | ✅ |

---

## Pilot QA (5-step)

| Step | Actor | Action |
|------|-------|--------|
| 1 | Coordinator | Build team → publish queue → publish |
| 2 | Team head | Mark attendance on team detail |
| 3 | Member | Submit replacement request (web or mobile) |
| 4 | Coordinator | Approve in replacements console |
| 5 | President | Review claims console + generate rankings |

**Accounts:** `protocol.coordinator@church.local`, `protocol.leader@church.local`, `protocol.teamhead@church.local` — `Pilot@123`

**P6 checks:** `/protocol/documents` loads Deacons shelf; `/admin/import` previews `PROTOCOL_MEMBERS`; `/protocol/teams/generate` links to church calendar.

**P7 checks:** Mobile Protocol → Request replacement; assignment tap shows detail sheet; runbook lists web routes.
