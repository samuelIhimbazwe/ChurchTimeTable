# Family Department — Product Specification

Enterprise-grade specification for the choir **Family Department**: four sovereign offices (member, family head, deputy, secretary), external reference imports, and phased improvement tiers.

**Related:** [`CHOIR_SYSTEM_STATUS.md`](../CHOIR_SYSTEM_STATUS.md) · [`API_CONTRACT_CONTRIBUTIONS_v1.md`](../pilot/API_CONTRACT_CONTRIBUTIONS_v1.md) · [`UNIT_LEADERSHIP.md`](UNIT_LEADERSHIP.md)

Last updated: June 2026

---

## 1. North star

Treat **Family** as a scoped operating unit (department), not a folder of choir pages.

| Principle | Target behavior |
|-----------|-----------------|
| **Sovereign offices** | Each role enters *their* office dimension — not committee hubs or another role’s desk |
| **ESS vs MSS split** | Member = self-service; head/deputy = manager self-service on *their family only* |
| **Target population** | All data and actions scoped to `family:{id}` — never whole-choir roster for family operators |
| **Workflow-first money** | Submit → family verify → (optional) treasury; every transition audited |
| **One primary work surface** | Inbox / obligation queue / progress desk — not card grids with links |
| **Dual-role clarity** | Singer + family head = two sidebar entries, never merged hubs |

### Office routes (canonical)

| Role | Office root | Sidebar label |
|------|-------------|---------------|
| Member | `/choir/{choirId}/membership` | My membership |
| Family head | `/choir/{choirId}/family-leadership` | Family leadership |
| Deputy | `/choir/{choirId}/family-deputy` | Family deputy |
| Secretary | `/choir/{choirId}/family-coordination` | Family coordination |

Legacy paths (`/member`, `/my-family`, `/family-head`, `/contributions/submit`) redirect to sovereign offices.

### One-sentence north star per role

| Role | North star |
|------|------------|
| **Member** | Tell me what I owe; let me pay and prove it; show me status. |
| **Family head** | Show me what needs my decision today; one click to confirm with full context. |
| **Deputy** | Same desk as head when empowered; transparent when not. |
| **Secretary** | Show me who is behind; give me a report for the family meeting. |

---

## 2. External import map (reference stack)

Borrow **patterns**, not visual clones. One coherent stack for the Family Department:

```
┌─────────────────────────────────────────────────────────────┐
│  FAMILY DEPARTMENT (enterprise module)                       │
├─────────────────────────────────────────────────────────────┤
│  Org layer (SAP EC)        → Family master + roles + payment │
│  ESS (SAP)                 → Member office                   │
│  MSS (SAP)                 → Head office + Take Action       │
│  Workflow (Power Automate) → Submit / delegate / approve     │
│  Console (Salesforce)      → Head/deputy Decision inbox      │
│  Workspace (Infor)         → 3-widget role homes             │
│  List–Detail (Fiori)        → Giving, progress, announcements │
│  Insights (Viva)            → Team health + suggested actions│
│  Multi-role UX              → Separate offices, permission matrix│
└─────────────────────────────────────────────────────────────┘
```

| Layer | Reference product | Use for |
|-------|-------------------|---------|
| Org + roles | SAP SuccessFactors Employee Central | ESS vs MSS, target population, Take Action on team member |
| Daily work | Salesforce Service Console | Inbox + split view + 360° record |
| Landing pages | Infor OS Workspace | 3–5 widgets per role, no feature dumping |
| Claims & approvals | Microsoft Power Automate | Stages, delegation, audit, notifications |
| Layouts | SAP Fiori List–Detail | Claims, announcements, member progress |
| Team signals | Microsoft Viva Insights | Aggregated health + suggested actions (not approvals) |
| Multi-role product | B2B multi-role UX (2025–2026) | Separate flows, permission-denied states, no hub tourism |

**Explicitly not references for this module:** generic church group-admin plugins, social feed dashboards, committee hub pages (president, treasurer, VP).

**Out of scope for now:** AI summaries, Copilot dashboards, AI case summarization (deferred — see Tier C note).

---

## 3. External imports by reference system

### 3.1 SAP SuccessFactors Employee Central (ESS / MSS / org model)

**Best for:** org structure, role separation, manager actions on *their team only*.

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **Employee Self-Service (ESS)** | Employee opens *their* profile; edits allowed fields; views pay/benefits read-only elsewhere | **Member office** = my giving, attendance, prep — not choir admin |
| **Manager Self-Service (MSS)** | Manager uses **Take Action** on a direct report from team list or person card | Head taps member → view giving progress, pending claim, note follow-up |
| **People Profile / Quick Card** | One person = one card with tabs (job, pay, history) | **Member 360** (head/secretary): slide-over with giving + attendance + contact |
| **Foundation objects** | Org unit ≠ person ≠ role assignment | **Family** (unit) ≠ **Member** (person) ≠ **Family role** (HEAD/DEPUTY/SECRETARY/MEMBER) |
| **RBAC + target population** | Manager edits *only* people who report to them | Head sees Family B only; secretary same population, different operations |
| **Workflow on MSS actions** | Manager initiates → approvers routed → audit trail | Claim: member submits → head/deputy confirms → optional treasurer |
| **Quick Action templates** | Pre-built actions with only needed fields | Confirm payment, reject with reason, request resubmit |
| **Org chart (team view)** | Visual hierarchy; drill to person | **My team**: head → members (not whole choir roster) |
| **Effective-dated changes** | History of what changed and when | Payment settings / family head changes with audit (who changed MoMo number) |

**Do not import:** full HR lifecycle (hire/fire, compensation bands, global company config).

---

### 3.2 Salesforce Service Console (agent workspace)

**Best for:** **Decision inbox** — family head’s daily job.

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **Split view** | Queue left; selected item right — no back button | Pending claims queue + claim detail on one screen |
| **Primary tab = interaction** | One case holds all context | One **claim** = one workspace (member, amount, proof, timeline, actions) |
| **Highlights panel** | 5–7 critical fields always visible | Claim header: ref #, member, amount, date, status, family |
| **360° customer view** | Account + cases + history on same screen | Member’s other claims + giving % + last attendance on claim screen |
| **Compact feed / timeline** | Chronological activity on the record | Submit → viewed → approved/rejected → thank-you sent |
| **Queue routing** | Work routed to right agent | Route to **deputy if delegated**, else **head** |
| **Macros / quick actions** | One-click approve standard amount, template reply | Approve full, approve partial (with reason), reject templates |
| **Utility bar** | Persistent tools: phone, knowledge, macros | Payment instructions, call member, family goal |
| **Wrap-up without losing context** | After action, next item in queue | After approve → auto-select next pending claim |

**Do not import:** multi-channel chat, CTI phone, AI case summarization.

---

### 3.3 Microsoft Power Automate (approval workflows)

**Best for:** deputy delegation, rejection rules, audit.

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **Approval stages** | Stage 1 → Stage 2 sequential | Member submit → family approval → (optional) treasurer |
| **Conditional branches** | If amount > X → extra approver | Partial approval → require discrepancy reason |
| **Conditional approver** | If deputy delegated → deputy; else head | `canApprove` on family drives workflow, not banner text |
| **Approvals center** | Single place pending approvals land | Head/deputy **Decision inbox** |
| **Respond from email / mobile** | Approve without full app | Future: email or WhatsApp deep link (Rwanda context) |
| **Published workflow definitions** | Admin configures who approves what | Choir admin: assistant can approve yes/no per family |
| **Audit on every response** | Who approved, when, comment | Required for reject/partial; visible in timeline |

**Do not import:** general business process designer for end users — keep workflows fixed and church-specific.

---

### 3.4 Infor OS Portal / enterprise workspace widgets

**Best for:** role home pages that feel purposeful, not empty.

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **Workspace = widgets only** | Landing is KPI + list + tasks — not full apps | Each office home: **max 3 widgets** |
| **Widget types** | KPI tile, list, task tracker, chart | Head: pending count · goal % · oldest pending age |
| **Persona-default layouts** | Admin assigns default workspace per role | Default homes for head vs secretary vs member |
| **Cross-app consolidation** | One hub pulls finance + HR + ops | One hub pulls giving + attendance + next rehearsal |
| **Actionable widgets** | List items click through to complete task | Widget row → opens claim detail, not another dashboard |
| **Shareable workspace templates** | Coordinator publishes layout to all families | Pilot template: “PILOT-B family head workspace” |

**Do not import:** user-built drag-drop dashboard builder in v1 — use fixed persona templates.

---

### 3.5 SAP Fiori List–Detail (master–detail)

**Best for:** member giving, secretary progress desk, announcements.

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **List pane + detail pane** | Select row → detail updates beside/below | Claims list + claim detail; members list + member progress |
| **Stacked on mobile** | List → drill to detail → back | Mobile: My claims → one claim |
| **Homogeneous lists** | Same columns per row; sort/filter | Secretary: sort by % complete, filter “behind” |
| **Inline actions** | Detail actions inline, not 4 pages deep | Approve/reject on detail pane |
| **Empty / zero states** | List empty = clear next action | “No pending — view family progress” |

**Do not import:** Fiori visual chrome literally — layout pattern only.

---

### 3.6 Microsoft Viva Insights (manager / team insights)

**Best for:** team health signals — not approvals.

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **Manager insights (aggregated)** | Patterns for *my team* only, privacy-safe | Head: “4/12 members behind on campaign” on home |
| **Suggested actions** | Actionable nudge from insight | “3 members below 50% — open progress desk” |
| **Brief surveys** | Pulse checks to team | Optional: family pulse (“rehearsal conflict this month?”) |
| **Adoption metrics** | Are people using the system? | Admin: % members who submitted via app vs cash-only |
| **Privacy by design** | Aggregates on manager view; detail on drill-down | Home widget = counts; names only inside team module |

**Do not import:** email/calendar analytics, Copilot dashboards, enterprise-wide analyst cubes.

---

### 3.7 Multi-role B2B UX (2025–2026 practice)

**Best for:** users with two hats (singer + family head).

| Import | Detail to copy | Apply to choir family |
|--------|----------------|------------------------|
| **Role catalog** | Goals, tasks, forbidden actions per role | One-pager per role (this spec §4) |
| **Permission matrix** | Object × operation × scope | Claim × approve × family scope |
| **Separate dashboards per role** | Never one universal cockpit | My membership + Family leadership as two entries |
| **Progressive disclosure** | Admin config hidden from operators | Head never sees “Families structure” |
| **Permission-denied recovery** | Clear escalation, not 403 | Deputy read-only: “Escalated to Head Joseph” |
| **Role change mid-session** | UI updates when delegation toggled | Toggle delegation → inbox actions appear/disappear live |
| **Plan vs role vs scope** | Don’t mix billing/plan with job role | Don’t mix committee roles into family office nav |

---

### 3.8 Cross-reference power combos

| Combo | From | Becomes in choir |
|-------|------|------------------|
| Inbox + 360 + timeline | Salesforce | Family head **Decision console** |
| ESS + list-detail | SAP + Fiori | Member **My giving** |
| MSS + target population + Take Action | SAP | Head/secretary **My team** (scoped) |
| Conditional approval stages | Power Automate | **Deputy delegation** |
| 3-widget workspace | Infor | All four **office homes** |
| Progress desk + export | Viva + secretary ERP habits | **Meeting pack** for family gathering |
| RBAC matrix | SAP + B2B UX | No roster / no VP hub leaks |

---

## 4. Role definitions (four offices)

### 4.1 Member — Employee Self-Service

**Purpose:** Know what I owe, do it, track confirmation — without choir admin or other families.

**Home (“My week”) — max 3 widgets:**

1. **Action queue** (max 3 items): rejected claim, pending confirmation, upcoming rehearsal/service  
2. **One giving status line** (goal % + next step)  
3. **Next event** (one, not a calendar app)

**Modules:**

| Module | Reference | Features |
|--------|-----------|----------|
| My obligations | ESS task inbox | Single list: pay, submit claim, fix rejection, prep for service |
| My giving | Financial self-service | Pay instructions, submit claim, history, receipt/thank-you status |
| My family team | Team directory (read-only) | Who is in my family, who is head, how to pay |
| My attendance | Personal record | My presence only |
| Music & prep | Job aids | Songs/uniform/pep talk for my upcoming services |
| Announcements | Internal comms | Choir-scoped; list-detail |

**Never:** roster, family structure admin, committee hubs, stewardship.

---

### 4.2 Family head — Manager Self-Service + approval authority

**Purpose:** Run the family as a unit — confirm money, watch participation, act on exceptions.

**Home (“Command”) — max 3 widgets:**

1. **Decision inbox** (count + oldest item age) — primary widget  
2. **Family goal** (one KPI bar)  
3. **Team health** (one grade or traffic-light)

**Modules:**

| Module | Features |
|--------|----------|
| Decision inbox | Pending claims; split-view list + full claim; approve/partial/reject with reason |
| Contributions | Overview, pending, member progress, family ledger |
| My team | Roster of *this family only*; roles; contact; link to member giving status |
| Participation | Family attendance/giving rank within choir context |
| Operations | Upcoming activities → mark **family team** attendance |
| Reports | **Meeting pack**: PDF/summary for family meeting |
| Payment settings | Family MoMo/bank/instructions (head-only write) |

**UI pattern:** Salesforce console — queue + 360° claim context + actions without navigation.

---

### 4.3 Family deputy — Delegated manager (conditional MSS)

**Purpose:** Support the head; confirm payments **only when delegation is on**.

| State | UX |
|-------|-----|
| **Delegation ON** | Same inbox as head; badge “Acting approver”; actions enabled |
| **Delegation OFF** | Read-only inbox; “Escalated to [Head name]”; notes allowed, not approve |

**Modules:** Same as head **minus** payment settings (unless explicitly delegated).

**Reference:** Power Automate conditional stages.

---

### 4.4 Family secretary — Team coordinator / analyst

**Purpose:** Track who is behind, prepare reports, chase members — **never** confirm payments.

**Home (“Progress desk”) — max 3 widgets:**

1. Members behind / no contribution (count)  
2. Pending at head (informational)  
3. Export/report shortcut  

**Modules:**

| Module | Features |
|--------|----------|
| Progress desk | Member × campaign matrix; sort by %; filter “needs follow-up” |
| Reports | Weekly/monthly family giving report; printable; share to head |
| Participation | Attendance context (read-only) |
| Contribution history | Ledger read-only |
| My team | Directory + last activity hints for follow-up |

**Never:** approve/reject buttons — hide unauthorized ops, don’t disable them.

---

## 5. Cross-cutting department capabilities

| Capability | Description |
|------------|-------------|
| **A. Family master record** | One canonical record per family: identity, head, deputies, secretary, payment rails, active campaign, member list |
| **B. Workflow state machine** | `DRAFT → SUBMITTED → FAMILY_PENDING → APPROVED/REJECTED → THANK_YOU_SENT`; each transition: actor, timestamp, reason on reject/partial |
| **C. Scoped RBAC** | Permissions always scoped: `family:{id}` + role |
| **D. Operational metrics** | Median time to confirm claim; % members on track; pending aging — head/secretary only |
| **E. Workflow-linked notifications** | Member: claim rejected. Head: 3 claims waiting > 48h. Secretary: 5 members below 50% |
| **F. Meeting pack / export** | One-click “Family B — March giving standup” PDF |
| **G. Dual-role clarity** | Two offices in nav; one primary landing per hat |

---

## 6. UI structure blueprint

| Surface | Pattern | Who |
|---------|---------|-----|
| Office home | 3 widgets + 0 tabs | All four |
| Primary work | List–detail or split inbox | Head, deputy, member (claims) |
| Secondary work | Full-page table | Secretary progress, head ledger |
| Settings | Small isolated form | Head (payment only) |
| Navigation | Portal + My membership + Family office | Scoped entries only |

**Visual system:** white/surface background, navy typography, one accent for primary action — not cream/gold wash cards.

**Density rule:**

- Member: low density (mobile-first)  
- Secretary: medium density (tables OK)  
- Head inbox: medium (queue + detail, not spreadsheet)

---

## 7. Improvement tiers (all tiers; AI excluded)

Features ranked by impact. **Tier C item “AI summaries” is explicitly deferred** — not in current scope.

### Tier S — transforms product feel (Wave 2)

| # | Feature | Primary reference | Roles |
|---|---------|-------------------|-------|
| S1 | **Decision inbox (split view)** | Salesforce Service Console | Head, deputy |
| S2 | **Member obligation queue** (one list: pay, fix rejection, next event) | SAP ESS | Member |
| S3 | **Family-scoped RBAC on API** (target population = my family) | SAP EC + B2B UX | All |
| S4 | **Claim timeline + audit** on every transaction | Salesforce + Power Automate | Head, deputy, member (read) |
| S5 | **Conditional deputy approval** (workflow, not banner text) | Power Automate | Deputy, head |

### Tier A — strong department credibility (Wave 2–3)

| # | Feature | Primary reference | Roles |
|---|---------|-------------------|-------|
| A6 | **Member 360** (person card / slide-over) | SAP People Profile | Head, secretary |
| A7 | **Secretary progress desk** (sortable matrix + filters) | SAP Fiori | Secretary |
| A8 | **Meeting pack export** (PDF/summary) | Viva + secretary ERP habits | Secretary, head |
| A9 | **3-widget persona homes** | Infor OS Workspace | All four |
| A10 | **Quick action templates** (approve partial, reject with reason) | SAP + Salesforce macros | Head, deputy |

### Tier B — polish and scale (Wave 3)

| # | Feature | Primary reference | Roles |
|---|---------|-------------------|-------|
| B11 | Explainable **family health score** | Viva Insights | Head |
| B12 | **Notification rules** tied to workflow states | Power Automate | All |
| B13 | Effective-dated **payment settings history** | SAP EC | Head |
| B14 | **“Oldest pending” aging KPI** for head | Salesforce queue metrics | Head, deputy |
| B15 | **Mobile stacked list–detail** everywhere | SAP Fiori | All |

### Tier C — later / optional (Wave 4; no AI)

| # | Feature | Primary reference | Notes |
|---|---------|-------------------|-------|
| C16 | Approve-from-email / WhatsApp | Power Automate | Rwanda mobile context |
| C17 | Configurable workspace per family | Infor templates | After fixed persona templates prove out |
| C18 | Pulse surveys | Viva Insights | Optional family pulse |
| ~~C19~~ | ~~AI summaries of family performance~~ | — | **Deferred — out of scope** |

**Additional Wave 3–4 items** (from enterprise blueprint, not tier-ranked):

- Campaign targets per member + family with exception alerts  
- Follow-up tasks for secretary (“call member X”)  
- Family team attendance as the only ops path for family operators  
- Thank-you / receipt delivery tracking visible to member and head  
- Period close: head marks family “reconciled for month X”  
- Advisor/coordinator read-only oversight role (optional fifth persona)

---

## 8. What not to build in v1

Enterprise maturity = **narrow depth**, not feature breadth.

- Don’t clone full **SAP HR** (positions, comp, succession)  
- Don’t clone full **Service Cloud** (omnichannel, AI, swarming)  
- Don’t give secretary **fake approve buttons** (disabled) — hide them  
- Don’t use gold/cream highlight cards as “enterprise” — use structure  
- Don’t merge **committee hubs** (president, treasurer) into **family department**  
- Don’t build **AI summaries** until explicitly prioritized

---

## 9. Current state vs target

| Built today (Phase 1) | Reference would add |
|-----------------------|---------------------|
| Separate routes/offices (`membership`, `family-leadership`, `family-deputy`, `family-coordination`) | **Default work surface** (inbox, not tabs) |
| Contributions hub (tabs) | **Split-view console** + queue aging |
| Sidebar permission fixes | **Target-population RBAC** everywhere on API |
| Member week cards | **Obligation queue** (ESS task list) |
| Secretary progress table | **Sort/filter + meeting pack + follow-up list** |
| Deputy delegation banner | **Workflow branch** + inbox behavior change |
| Clickable cards, office shells, sticky tab bar | **List–detail** with inline actions |
| Clean surface-raised cards (no gold wash) | **3-widget persona homes** |

**Phase 1 delivered:** routing, nav hygiene, contribution depth, office shells, visual cleanup.  
**Phase 2 target:** Tier S + Tier A as real product surfaces, not more routing/card tweaks.

---

## 10. Implementation phasing

| Wave | Tiers | Focus |
|------|-------|-------|
| **Phase 1 (done)** | — | Sovereign offices, nav, contributions hubs, redirects, office shells |
| **Wave 2** | Tier S | Decision inbox, obligation queue, API RBAC, claim timeline, deputy workflow |
| **Wave 3** | Tier A + partial B | Member 360, progress desk, meeting pack, 3-widget homes, quick actions |
| **Wave 4** | Tier B + Tier C (no AI) | Health score, notification rules, payment history, mobile list-detail, email/WhatsApp approve |

---

## 11. Screen-by-screen spec order

| # | Spec | Status |
|---|------|--------|
| 1 | [**Family head Decision console**](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md) (Salesforce + SAP MSS) | **Done** |
| 2 | [**Member obligation + giving**](MEMBER_OBLIGATIONS_GIVING_SPEC.md) (SAP ESS + Fiori) | **Done** |
| 3 | Secretary progress desk + meeting pack (Fiori + Viva nudges) | Next |
| 4 | Deputy delegation states (Power Automate) | Planned |

Each screen spec cites external import(s) and tier item(s). Decision console: **S1, S4, S5, A6, A9, A10, B14**. Member obligations: **S2, S4, A9, B15**.

---

## 11a. Implementation start (Wave 2)

**When to start:** Now — head Decision console spec is complete and APIs already exist for inbox, approve/reject, timeline, and member claims. Member spec is complete; member work can follow immediately after head console or run in parallel.

**Recommended build order:**

| Sprint | Build | Spec | Est. effort |
|--------|-------|------|-------------|
| **1** | Family head Decision Console + 3-widget Command home + `Decisions` nav | [`FAMILY_HEAD_DECISION_CONSOLE_SPEC.md`](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md) | 1–2 days |
| **2** | Member obligation queue + giving list–detail + 3-widget My week | [`MEMBER_OBLIGATIONS_GIVING_SPEC.md`](MEMBER_OBLIGATIONS_GIVING_SPEC.md) | 1–2 days |
| **3** | API gaps (inbox `receiptUrl`, ledger `memberId` filter, leadership `GET :id`) + family-scoped RBAC hardening | Parent spec Tier S3 | 1 day |
| **4** | Secretary progress desk + meeting pack | Planned spec §11 item 3 | 1–2 days |

**Do not wait for** secretary/deputy screen specs before Sprint 1–2 — those reuse patterns from Sprints 1–2.

**Pilot validation:** After Sprint 1, log in as `choir.familyhead@church.local` and confirm a claim without leaving one screen. After Sprint 2, log in as `choir.singer@church.local` and complete submit → wait → head confirm → member sees update.

---

## 11b. Tier and external-import coverage (Sprints 1–4 vs full roadmap)

**Important:** Sprints 1–4 are **Wave 2 core** — highest-impact Tier **S** work plus parts of **A/B**. They do **not** ship every improvement tier or every external import at full depth.

### Sprint → tier mapping

| Tier | Feature | Sprint(s) | Status after Sprint 4 |
|------|---------|-----------|-------------------------|
| **S1** | Decision inbox (split view) | 1 | ✅ Shipped |
| **S2** | Member obligation queue | 2 | ✅ Shipped |
| **S3** | Family-scoped RBAC on API | 3 | ✅ Shipped |
| **S4** | Claim timeline + audit | 1 + 2 | ✅ Shipped |
| **S5** | Conditional deputy approval | 1 (UI); item 4 spec (workflow polish) | ⚠️ Partial |
| **A6** | Member 360 slide-over | 1 (lite strip + panel) | ⚠️ Partial |
| **A7** | Secretary progress desk | 4 | ⚠️ Planned |
| **A8** | Meeting pack export | 4 | ⚠️ Partial |
| **A9** | 3-widget persona homes | 1 + 2 (head + member) | ⚠️ Partial |
| **A10** | Quick action templates | 1 | ✅ Shipped |
| **B11** | Explainable family health score | — | ❌ Wave 3 |
| **B12** | Workflow-linked notifications | — | ❌ Wave 3 |
| **B13** | Payment settings change history | — | ❌ Wave 3 |
| **B14** | Oldest-pending aging KPI | 1 | ✅ Shipped |
| **B15** | Mobile stacked list–detail | 2 (giving only) | ⚠️ Partial |
| **C16** | Approve from email / WhatsApp | — | ❌ Wave 4 |
| **C17** | Configurable workspace per family | — | ❌ Wave 4 |
| **C18** | Pulse surveys | — | ❌ Wave 4 |
| ~~**C19**~~ | ~~AI summaries~~ | — | **Out of scope** |

**Scorecard after Sprint 4:** ~12 of 18 tier items touched; ~8 fully or mostly done. Tier **S** ≈ 90%; Tier **A** ≈ 60%; Tier **B** ≈ 20%; Tier **C** = 0% (by design).

### Tier items **not** in Sprints 1–4

| Group | Items |
|-------|-------|
| **Tier A (remainder)** | Full A6 (360 attendance tab + APIs); A9 for **deputy + secretary** |
| **Tier B (most)** | B11 health score; B12 notifications; B13 payment history; B15 on head console, secretary, announcements |
| **Tier C (all in scope)** | C16, C17, C18 |
| **Cross-cutting §5 (partial)** | Operational metrics (median confirm time); workflow notifications; period close; follow-up tasks; thank-you tracking; advisor read-only role |

### External import coverage

| Reference | Sprints 1–4 | Mostly in | Still missing (Wave 3–4) |
|-----------|-------------|-----------|---------------------------|
| **SAP ESS** | ✅ Mostly | Sprint 2 | Optional server-side obligations API |
| **SAP MSS** | ✅ Mostly | Sprint 1 | Full Take Action menu on team |
| **Salesforce Console** | ✅ Mostly | Sprint 1 | Mobile utility bar polish |
| **Power Automate** | ⚠️ Partial | Sprint 1; Sprint 4 deputy | Email approve, admin workflow config, B12 notification rules |
| **Infor Workspace** | ⚠️ Partial | Sprint 1–2 | Deputy/secretary 3-widget homes; C17 templates |
| **SAP Fiori** | ⚠️ Partial | Sprint 2; Sprint 4 | List–detail on all surfaces |
| **Viva Insights** | ❌ Minimal | Sprint 4 secretary (planned) | B11 health score, suggested actions, C18 pulse |
| **Multi-role B2B UX** | ⚠️ Partial | Phase 1 nav; Sprint 3 RBAC | Permission matrix UI; mid-session delegation refresh |

**Pattern imports** (split view, list–detail, ESS queue, widgets) → Sprints **1–2**.  
**Operational maturity** imports (Viva, notifications, effective-dated history, WhatsApp) → **Wave 3–4**.

### Extended roadmap (full tier + import completion)

| Wave | Sprints | Delivers |
|------|---------|----------|
| **Wave 2** | **1–4** (current plan) | Tier **S** + core **A** — head console, member ESS, RBAC, secretary desk |
| **Wave 3** | **5–6** | Remaining **A** + **B** — deputy home, full 360, health score, notifications, payment history, mobile list–detail everywhere |
| **Wave 4** | **7+** | Tier **C** (no AI) — WhatsApp approve, configurable workspaces, pulse surveys |

### What Sprints 1–4 actually answer

| Question | Answer |
|----------|--------|
| Does this feel like a real department for **head + member + basic secretary**? | **Yes** — after Sprint 4 |
| Is every improvement tier and external import shipped at enterprise depth? | **No** — see tables above |

---

## 12. Permission matrix (summary)

| Object / action | Member | Secretary | Deputy (delegated) | Deputy (not delegated) | Head |
|-----------------|--------|-----------|--------------------|-------------------------|------|
| Submit own claim | ✓ | — | ✓ (as member) | ✓ (as member) | ✓ (as member) |
| View family member progress | own only | ✓ read | ✓ | ✓ read | ✓ |
| Approve/reject claim | — | — (hidden) | ✓ | — (escalate) | ✓ |
| Edit payment settings | — | — | — | — | ✓ |
| Export meeting pack | — | ✓ | ✓ read | ✓ read | ✓ |
| Mark family team attendance | — | — | ✓ if delegated ops | read | ✓ |
| View choir roster / families structure | — | — | — | — | — |

Full matrix to be expanded in Wave 2 API RBAC work (Tier S3).

---

## 13. Key file index (implementation)

| Area | Paths |
|------|-------|
| Member office | `web/components/choir/MemberOfficeShell.tsx`, `web/app/(dashboard)/choir/[choirId]/membership/**` |
| Family offices | `web/components/choir/FamilyOfficeShell.tsx`, `family-leadership/**`, `family-deputy/**`, `family-coordination/**` |
| Office frame / themes | `web/components/choir/OfficeShellFrame.tsx`, `web/lib/choir/office-themes.ts` |
| Nav | `web/lib/navigation/choir-nav.ts`, `web/components/layout/sidebar.tsx` |
| Contributions UI | `MemberContributionsHub.tsx`, `FamilyLeadershipContributionsHub.tsx` |
| API context | `backend/src/member-portal/choir-dashboard-context.service.ts` |
| Officer roles | `backend/src/member-portal/choir-officer-roles.util.ts` |

---

## 14. Pilot test accounts

Main choir ID (local): `00000000-0000-0000-0000-000000000001`

| Account | Role |
|---------|------|
| `choir.singer@church.local` | Member |
| `choir.familyhead@church.local` | Family head |
| `choir.asstfamily@church.local` | Deputy (PILOT-B delegation) |
| `choir.familysec@church.local` | Secretary |

Passwords: pilot `Pilot@123`; admin `Admin@123`.
