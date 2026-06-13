# Committee Positions — Product Specification

Enterprise-grade specification for the choir **Committee layer**: ten fixed committee seats, composable **Advisor / custom roles**, external reference imports, and phased improvement tiers.

**Related:** [`FAMILY_DEPARTMENT_SPEC.md`](FAMILY_DEPARTMENT_SPEC.md) · [`CHOIR_SYSTEM_STATUS.md`](../CHOIR_SYSTEM_STATUS.md) · [`pilot/CHOIR_OFFICER_ROLES.md`](../pilot/CHOIR_OFFICER_ROLES.md) · [`UNIT_LEADERSHIP.md`](UNIT_LEADERSHIP.md)

Last updated: June 2026

---

## 1. North star

Treat **Committee** as the choir’s **executive operating layer** — not a duplicate of Family Department, not a card grid of links.

| Principle | Target behavior |
|-----------|-----------------|
| **Sovereign seats** | Each fixed committee role enters *their* desk — president ≠ treasurer ≠ music director |
| **Whole-choir scope** | Committee operators work on `choir:{id}` — families are a dimension, not the primary boundary |
| **Workflow-first governance** | Join requests, discipline, welfare, treasury, and approvals are **queues with state**, not static pages |
| **One primary work surface** | Decision inbox / verification queue / case desk — not hub tabs that only link elsewhere |
| **Advisor = permission profile** | “Advisor” is a **label**, not a fixed feature bundle — UI builds from effective permissions |
| **Dual-layer clarity** | Family head (committee assignment) **redirects** to Family leadership office — never two desks for one hat |
| **Segregation of duties** | President approves people/policy; treasurer approves money; secretary records; neither merges casually |

### Committee routes (canonical)

| Role key | Hub segment | Sidebar / entry label | Scope |
|----------|-------------|-------------------------|-------|
| `president` | `/choir/{choirId}/president` | President | Whole choir |
| `vice_president` | `/choir/{choirId}/vice-president` | Vice President | Whole choir |
| `music_director` | `/choir/{choirId}/music-direction` | Music direction | Music + rehearsals |
| `family_coordinator` | `/choir/{choirId}/family-coordinator` | Family coordinator | All families (read/manage) |
| `secretary` | `/choir/{choirId}/records` | Records & operations | Whole choir records |
| `treasurer` | `/choir/{choirId}/budget` | Finance & budget | Whole choir money |
| `discipline_social_welfare` | `/choir/{choirId}/care` | Care & discipline | Cases + welfare |
| `spiritual_leader` | `/choir/{choirId}/spiritual` | Spiritual life | Devotions + programs |
| `advisor` | `/choir/{choirId}/advisor` | Advisor desk | **Effective permissions only** |
| `family_head` | `/choir/{choirId}/family-leadership` | Family leadership | **Redirect** — Family Department |

Legacy paths (`/choir/president`, `/choir/budget`, etc. without `{choirId}`) resolve via choir scope helper.

### One-sentence north star per fixed seat

| Seat | North star |
|------|------------|
| **President** | Show me what needs my decision today across people, policy, and choir health. |
| **Vice President** | Act when the president is away; delegate what I am explicitly trusted with. |
| **Music Director** | Tell the choir what to sing, when to rehearse, and who is prepared. |
| **Family Coordinator** | Show me which families are behind and where structure needs fixing. |
| **Secretary** | Keep the choir’s official record accurate, searchable, and exportable. |
| **Treasurer** | Reconcile money, close periods, and prove stewardship to leadership. |
| **Care & Welfare** | Open a case, follow it to resolution, protect confidentiality. |
| **Spiritual Leader** | Publish what nurtures holiness this week — devotions, prayer, programs. |
| **Advisor (any profile)** | Show me only the tools I was entrusted with — counsel within that boundary. |

---

## 2. Advisor & custom roles — non-negotiable model

**Problem:** In real choirs, “Advisor” (Umujyanama / Inteko) is unpredictable. Two advisors in the **same choir** often have **completely different** access — one sees finance only, another runs operations, a third is counsel-only with event read.

**Rule:** Never implement Advisor as a fixed persona with a static module list. Implement **permission-composed desks**.

### 2.1 Three assignment mechanisms (today)

| Mechanism | Storage | Who edits | Granularity |
|-----------|---------|-----------|-------------|
| **Committee role template** | `ChoirCommitteeRole.permissionsJson` per choir | President / governance (`upsertChoirCommitteeRole`) | Per **role name** in that choir (default seed in `seed.ts`) |
| **Committee member assignment** | `ChoirCommitteeMember` → role row | President on Position roles | Person holds role; gets that choir’s template for `advisor`, `president`, etc. |
| **Custom role** | `ChoirCustomRole` + `ChoirCustomRolePermission` + `ChoirMemberCustomRole` | President / roles admin | Named bundle (e.g. “Development Advisor”, “Uniqueness Advisor”) assigned per person |

Default seed `advisor` permissions (read-heavy baseline):

- `event:read`, `choir.finance.view`, `choir.reports.view`, `discipline:read_all`

Choirs may replace this entirely via governance without changing code.

### 2.2 Effective permissions (runtime)

```
effectivePermissions(user, choir) =
  union(
    baseline member permissions,
    system role permissions (CHOIR_*),
    committee role permissions (assigned + inferred templates),
    custom role permissions (assigned bundles),
    admin overrides
  )
```

**UI rule:** Navigation, hub tiles, and API guards use **`effectivePermissions`**, not **`roleKey === 'advisor'`**.

**Current implementation (partial):**

- `AdvisorCapabilityPanel` maps permission codes → tool links (good pattern — extend to all composable seats).
- `ChoirPositionHubShell` + advisor page: “My assigned access” + optional snapshot gated by permissions (good).
- **Gap (Wave C0):** `ChoirDashboardContext` does not yet surface `ChoirCustomRole` assignments; auth resolver must union custom role permissions before `/auth/me` and dashboard context.

### 2.3 Advisor desk UX (target)

| Tab / surface | Behavior |
|---------------|----------|
| **My assigned access** (primary) | Dynamic grid from permission → capability map (like today’s `ADVISOR_CAPABILITY_LINKS`) |
| **Choir snapshot** (optional) | KPI tiles **each gated** by permission — empty state if none granted |
| **No fixed third tab** | Do not add “Finance tab” for all advisors — finance appears only if `choir.finance.view` |

**Multiple advisors:** Same route `/advisor`; different people see different cards. Optional subtitle from custom role name: “Development Advisor” vs “Counsel Advisor”.

### 2.4 Custom roles vs committee roles

| Use committee role | Use custom role |
|--------------------|-----------------|
| Standard seat (president, treasurer, …) | Non-standard focus (“Recording Advisor”, “Uniform Advisor”) |
| One person per seat convention | Multiple parallel advisors with different bundles |
| Choir-wide template in governance | Named bundle reusable across members |

**Enterprise analog:** SAP **position** (job) vs **targeted role assignment**; ServiceNow **duty separation** via **contained roles**; Entra **PIM eligible roles** activated per task (future: time-bound advisor elevation).

### 2.5 Governance requirements

| Requirement | Reference |
|-------------|-----------|
| Audit every permission change | SAP GRC / SOX change log |
| Show diff when editing advisor template | ITSM change request detail |
| Prevent treasurer + president both holding `choir.finance.approve` on same person without break-glass flag | SOX segregation of duties |
| Export “who can approve money” report | SAP access risk analysis |

---

## 3. External import map (committee stack)

Borrow **patterns**, not visual clones. One coherent stack for the Committee layer:

```
┌─────────────────────────────────────────────────────────────┐
│  COMMITTEE LAYER (enterprise module)                         │
├─────────────────────────────────────────────────────────────┤
│  Positions (SAP EC / Workday)     → Committee seats + custom│
│  Access governance (SAP GRC)      → Advisor variability     │
│  Executive console (Salesforce)   → President / VP inbox    │
│  Financial close (SAP FI / Oracle) → Treasurer verification │
│  Case management (ServiceNow)     → Care & discipline desk  │
│  Workflow (Power Automate)        → Delegation + approvals  │
│  Workspace (Infor OS)             → 3-widget committee homes│
│  List–Detail (SAP Fiori)          → Records, finance queue  │
│  Insights (Viva / Power BI)       → Leadership KPIs         │
│  Content ops (SharePoint / CMS)   → Spiritual + announcements│
└─────────────────────────────────────────────────────────────┘
```

| Layer | Reference product | Use for |
|-------|-------------------|---------|
| Positions & assignments | SAP SuccessFactors EC, Workday HCM | Committee seat ≠ person; effective-dated assignments |
| Composable access | SAP GRC, Microsoft Entra custom roles | Advisor/custom role bundles; SoD checks |
| Executive decisions | Salesforce Service Console | President/VP decision inbox + 360° member |
| Financial stewardship | SAP FI-GL close, Oracle Financials, Blackbaud | Treasurer verification queue, period close |
| Case workflow | ServiceNow ITSM / HR Case Management | Welfare + discipline cases with SLA |
| Delegation | Microsoft Power Automate, Camunda | VP stand-in, president out-of-office |
| Role homes | Infor OS Portal, SAP Launchpad | 3–5 widgets per committee seat |
| Master–detail | SAP Fiori | Join queue, treasury queue, records lists |
| Choir health | Microsoft Viva Insights, Power BI embedded | President snapshot — not approvals |
| Spiritual content | SharePoint news, church CMS patterns | Devotion publish workflow |
| Records / compliance | M-Files, OpenText | Secretary document retention + audit trail |

**Explicitly not references for this layer:** Family Department ESS/MSS (see [`FAMILY_DEPARTMENT_SPEC.md`](FAMILY_DEPARTMENT_SPEC.md)), generic church social feeds, monolithic “leader dashboard” with every module linked.

**Out of scope for now:** AI executive summaries, Copilot approval suggestions (deferred).

---

## 4. External imports by reference system

### 4.1 SAP SuccessFactors / Workday — positions & org

**Best for:** committee structure, assignment history, advisor variability.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Position management** | Position ≠ incumbent; vacancy tracking | `ChoirCommitteeRole` template ≠ `ChoirCommitteeMember` assignment |
| **Effective dating** | Role starts/ends on dates | Advisor term ends → auto-revoke (future) |
| **Concurrent employment** | Person holds two positions with rules | Singer + treasurer = two nav entries |
| **Position descriptions** | Standard duties text | `CHoirPositionGuide` / `choir-positions.ts` meta |
| **Matrix reporting** | Dotted-line advisor to president | Custom role “Reports to President” label only |

### 4.2 SAP GRC / SOX — segregation & advisor risk

**Best for:** treasurer/president split, advisor over-permissioning.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **SoD rules** | Mutually exclusive duties | Same user: president + treasurer approve → warn/block |
| **Access risk simulation** | What if we grant X? | Preview advisor permission bundle before save |
| **Mitigating controls** | Dual approval for sensitive ops | Large contribution adjust → president + treasurer |
| **Audit trail** | Who granted `choir.finance.manage` | Governance audit on `permissionsJson` change |

### 4.3 Salesforce Service Console — president / VP desk

**Best for:** **Decision inbox** — join requests, escalations, policy exceptions.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Split view queue** | Work left, detail right | Join request queue + member 360 |
| **Highlights panel** | Critical fields always visible | Applicant, sponsor, family placement, prior discipline |
| **360° record** | All related objects on one screen | Member + attendance + giving + cases |
| **Macros** | Approve standard path in one click | Approve join + assign family + welcome notify |
| **Queue routing** | Route to VP when president OOO | Power Automate + VP delegation flag |
| **Wrap-up → next** | After action, next queue item | President processes 10 joins without navigation |

### 4.4 SAP FI / Oracle Financials — treasurer desk

**Best for:** money verification, period close, stewardship reports.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Verification queue** | Items awaiting posting | Family-approved claims awaiting treasury confirm |
| **Three-way match** | PO / receipt / invoice | Claim / proof / family approval alignment |
| **Period close checklist** | Month cannot close with exceptions | “March umusanzu — 3 families unreconciled” |
| **Adjustment journal** | Correcting entries with reason | `choir.contribution.adjust` with mandatory note |
| **Management reporting** | Board pack export | Treasurer → leadership PDF (campaign, variance) |
| **Read-only exec view** | President sees summary not ledger | `choir.finance.view` without `manage` |

### 4.5 ServiceNow — care & discipline cases

**Best for:** `discipline_social_welfare` primary surface.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Case record** | Single incident with state | Welfare visit case; discipline case |
| **Assignment groups** | Route to care officer | Auto-assign to discipline seat holder |
| **SLA timers** | Response due in N days | “Welfare case open > 7 days” alert president |
| **Confidential fields** | Restricted notes | Discipline notes not visible to regular members |
| **Related records** | Link member, events | Case ↔ member ↔ attendance pattern |
| **Knowledge articles** | Choir rule charter | Published rules linked from case |

### 4.6 Microsoft Power Automate — delegation & approvals

**Best for:** VP stand-in, multi-step governance.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Out-of-office delegation** | Approvals reroute | President marks OOO → VP gets join queue |
| **Sequential approval** | A then B | Join → family coordinator confirm placement |
| **Parallel approval** | A and B | Large budget line → president + treasurer |
| **Timeout escalation** | Pending > 48h → notify | Stale join request nudge |
| **Audit on response** | Comment required on reject | Join reject reason mandatory |

### 4.7 Infor OS / SAP Launchpad — committee homes

**Best for:** every fixed seat’s landing page.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **3-widget default** | KPI + list + task | President: pending decisions · attendance trend · oldest SLA |
| **Persona templates** | Default layout per role | Seed layout per `roleKey` |
| **Actionable list widget** | Row opens task completion | Treasurer row → claim verification |
| **No feature dumping** | Widgets ≠ full app grid | Remove 12-card hub pages over time |

### 4.8 SAP Fiori — list–detail surfaces

**Best for:** secretary records, treasurer queue, music library.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Master–detail** | Select row → detail pane | Documents list + preview; song list + parts |
| **Sort / filter / group** | Secretary ops reports | Activities by month; exports |
| **Inline actions** | Act on selected row | Mark rehearsal attendance from list |
| **Mobile stack** | List → detail → back | Care officer mobile case update |

### 4.9 Microsoft Viva / Power BI — leadership insights

**Best for:** president/advisor snapshot (read-only).

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Executive summary tiles** | Aggregated KPIs | Attendance rate, giving campaign %, open cases |
| **Suggested actions** | Nudge not approval | “4 families below 50% — open coordinator desk” |
| **Drill-through** | Tile → filtered list | KPI → family rankings (if permitted) |
| **Privacy** | Aggregates on snapshot | No member names on president home widget |

### 4.10 SharePoint / CMS — spiritual & comms

**Best for:** spiritual leader, announcement workflow.

| Import | Detail to copy | Apply to choir committee |
|--------|----------------|--------------------------|
| **Publish workflow** | Draft → review → publish | Devotion draft → spiritual leader publish |
| **Audience targeting** | Choir-scoped | Announcement to all members vs officers |
| **Version history** | Rollback bad publish | Devotion version audit |
| **Scheduled publish** | Verse of day timing | Already wired for VERSE_OF_DAY notifications |

---

## 5. Module × role matrix

Eleven choir modules (+ committee role hub). **R** = primary owner · **C** = contribute · **V** = view · **—** = no access · **∗** = permission-gated (Advisor/custom).

| Module | Route segment | President | VP | Music | Fam coord | Secretary | Treasurer | Care | Spiritual | Advisor |
|--------|---------------|:---------:|:--:|:-----:|:---------:|:---------:|:---------:|:----:|:---------:|:-------:|
| **Operations & scheduling** | `scheduling`, `activities` | R | R | C | V | R | — | C | — | ∗ |
| **Membership & join** | `join-requests`, `members` | R | R | — | C | C | — | C | — | ∗ |
| **Music & rehearsals** | `music`, `music-direction` | V | V | R | — | C | — | — | — | ∗ |
| **Families (whole choir)** | `family-coordinator`, `families` | V | V | — | R | V | V | V | — | ∗ |
| **Finance & contributions** | `budget`, `finance`, `stewardship` | V | V | — | V | — | R | V | — | ∗ |
| **Records & documents** | `records`, `documents`, `meetings` | V | V | V | V | R | V | V | V | ∗ |
| **Care & discipline** | `care`, `discipline`, `welfare` | R | R | — | C | V | V | R | — | ∗ |
| **Spiritual life** | `spiritual` | V | C | — | — | V | — | — | R | ∗ |
| **Announcements** | `announcements` | R | R | C | C | R | — | C | C | ∗ |
| **Reports & analytics** | `reports`, `analytics` | R | R | C | R | R | R | C | — | ∗ |
| **Governance & roles** | `roles`, `public-profile` | R | C | — | — | V | — | — | — | ∗ |

**Family Department overlap:** Family head **never** uses committee `family_head` hub — only [`/family-leadership`](FAMILY_DEPARTMENT_SPEC.md). Family coordinator sees all families; family head sees one family in Family Department.

### Module enterprise imports (detail)

| Module | Primary reference | Key features to import |
|--------|-------------------|------------------------|
| Operations | SAP PM / MS Project lite | Activity calendar, assignment rotation, attendance capture |
| Membership | Workday onboarding | Join queue, sponsor review, position assignment |
| Music | Planning Center / CCLI patterns | Song notify, rehearsal plan, voice section roster |
| Families (choir-wide) | SAP org units | Rankings, structure admin, cross-family reports |
| Finance | Blackbaud / SAP FI | Campaigns, treasury queue, period close, SoD |
| Records | M-Files / SharePoint records | Meetings, documents, audit read, asset register |
| Care | ServiceNow HR Case | Case states, confidential notes, SLA |
| Spiritual | CMS publish workflow | Devotions, intercession lists, program calendar |
| Announcements | Salesforce MC / internal comms | Targeted broadcast, read receipts (future) |
| Reports | Power BI / SAP BW lite | Export packs, executive summary |
| Governance | SAP GRC | Role templates, custom roles, SoD warnings |

---

## 6. Fixed seat definitions

### 6.1 President — Executive operator

**Purpose:** Run choir governance — people, policy, health — not daily data entry.

**Home (target) — max 3 widgets:**

1. **Decision inbox** (join + escalations + stale approvals)  
2. **Choir health** (attendance + giving campaign aggregate)  
3. **Officer SLA** (open welfare/discipline cases aging)

**Primary surface:** Salesforce-style split inbox (§4.3).

**Modules:** Membership R, Care R, Announcements R, Reports R, Operations R, Governance R.

**Never:** Replace treasurer verification; edit family payment settings (Family Department).

---

### 6.2 Vice President — Delegated executive

**Purpose:** Stand in for president; operate with **explicit delegation**, not silent full clone.

**Home:** Same widget **types** as president; counts reflect **routed** work only when delegation active.

**Delegation (target):** Power Automate model — `presidentOutOfOffice` routes join queue + welfare escalations to VP.

**Modules:** Near-president except **finance manage** and **governance role edit** (configurable per choir template).

**Enterprise import:** Salesforce **delegate approver** + Entra **temporary elevation**.

---

### 6.3 Music Director — Production operator

**Purpose:** Musical readiness — repertoire, rehearsals, member notify.

**Home — max 3 widgets:**

1. **Next rehearsal / service** music set  
2. **Members not notified** for upcoming set  
3. **Rehearsal attendance** last 2 sessions

**Primary surface:** Fiori list–detail on songs + rehearsal roster.

**Modules:** Music R, Operations C (rehearsal events), Announcements C (song notify).

**Enterprise import:** Planning Center **plan → notify → track** pipeline.

---

### 6.4 Family Coordinator — Cross-family operator

**Purpose:** Whole-choir family structure, rankings, escalations — **not** single-family approval (Family head desk).

**Home — max 3 widgets:**

1. Families below participation threshold  
2. Structure gaps (no head / vacant family)  
3. Cross-family ranking movement

**Primary surface:** Fiori matrix (families × metrics) + drill to family record.

**Modules:** Families R, Reports C, Care C, Finance V.

**Boundary:** Opens Family Department read views; does **not** approve member claims (Family head/deputy).

**Enterprise import:** SAP **org unit maintenance** + Viva **team comparison** (aggregated).

---

### 6.5 Secretary — Records & operations custodian

**Purpose:** Authoritative choir record — schedule, documents, assets, meetings, exports.

**Home — max 3 widgets:**

1. **This week’s activities** (ops schedule)  
2. **Records needing update** (missing minutes, asset check)  
3. **Export shortcut** (monthly ops report)

**Primary surface:** Fiori master–detail across records modules.

**Modules:** Records R, Operations R, Music C, Announcements R.

**Naming collision:** Choir `secretary` ≠ Family `SECRETARY` — different routes, permissions, and specs.

**Enterprise import:** M-Files **document lifecycle** + SAP **audit log read**.

---

### 6.6 Treasurer — Financial steward

**Purpose:** Verify money, manage campaigns, close periods, report upward.

**Home — max 3 widgets:**

1. **Verification queue** (family-approved → treasury pending)  
2. **Campaign progress** vs target  
3. **Period close checklist**

**Primary surface:** SAP FI-style verification queue (§4.4).

**Modules:** Finance R, Reports C, Welfare V (coordination only).

**SoD:** Treasurer holds `choir.finance.approve`; president should not on same account without break-glass.

**Enterprise import:** Blackbaud **batch posting** + Oracle **month-end close**.

---

### 6.7 Care & Welfare — Case operator

**Purpose:** Discipline and member care as **cases**, not ad-hoc pages.

**Home — max 3 widgets:**

1. **Open cases** by priority  
2. **SLA breaches**  
3. **Attendance-driven alerts** (chronic absence)

**Primary surface:** ServiceNow case desk (§4.5).

**Modules:** Care R, Welfare R, Membership C, Announcements C.

**Enterprise import:** ServiceNow **HR case** confidentiality model.

---

### 6.8 Spiritual Leader — Content operator

**Purpose:** Holiness nurture — devotions, prayer, programs.

**Home — max 3 widgets:**

1. **Draft / scheduled** devotions  
2. **This week’s program**  
3. **Publish confirmation** (last sent)

**Primary surface:** CMS publish pipeline (§4.10).

**Modules:** Spiritual R, Announcements C.

---

### 6.9 Advisor — Composable counsel desk

**Purpose:** Counsel and oversee **within assigned permissions only**.

**Not a purpose:** Default access to finance, ops, or governance.

**Home:** **My assigned access** (dynamic card grid) — already implemented via `AdvisorCapabilityPanel`.

**Optional second tab:** Choir snapshot (KPI tiles permission-gated) — already implemented on advisor page.

**Implementation rules:**

1. **Never** show modules the user lacks permission for — hide, don’t disable.  
2. **Reuse** `ADVISOR_CAPABILITY_LINKS` pattern for **any** composable seat (including custom roles).  
3. **Label** from custom role name when present (“Uniqueness Advisor”).  
4. **Union** custom role permissions in auth + dashboard context (Wave C0).  
5. **Audit** permission grants (Wave C1).

**Enterprise import:** SAP GRC **firefighter / contingent access** — time-bound elevated read.

---

## 7. Cross-cutting committee capabilities

| Capability | Description | Reference |
|------------|-------------|-----------|
| **A. Committee master** | One row per seat template per choir + assignments + custom roles | SAP EC positions |
| **B. Effective permissions resolver** | Single union for API + UI | Entra RBAC |
| **C. Decision queues** | Join, treasury, welfare, discipline as stateful queues | Salesforce + ServiceNow |
| **D. Segregation of duties** | Warn on toxic permission combos | SAP GRC |
| **E. Delegation** | President OOO → VP routing | Power Automate |
| **F. 3-widget persona homes** | Every fixed seat | Infor OS |
| **G. Audit on governance changes** | Role template edits | SOX change log |
| **H. Dual nav for dual hats** | Member office + committee seat as separate entries | B2B multi-role UX |
| **I. Composable capability map** | Permission → tool link registry (shared) | SAP Launchpad tiles |

---

## 8. UI structure blueprint

| Surface | Pattern | Who |
|---------|---------|-----|
| Seat home | 3 widgets + 0–1 secondary tab | Fixed seats |
| Advisor home | Capability grid (+ optional snapshot) | Advisor / custom roles |
| Primary work | Split inbox or case desk | President, VP, treasurer, care |
| Secondary work | Fiori list–detail | Secretary, music, coordinator |
| Settings | Governance / roles page | President |
| Navigation | Membership + committee seat(s) + family office if applicable | Dual-hat users |

**Density rule:**

- President inbox: medium (queue + detail)  
- Treasurer queue: medium-high (numbers + proof thumbnails)  
- Secretary tables: high (export-friendly)  
- Advisor grid: low (only what’s assigned)

---

## 9. Improvement tiers

Features ranked by impact. **AI executive summaries deferred.**

### Tier S — transforms committee feel (Wave C1)

| # | Feature | Primary reference | Roles |
|---|---------|-------------------|-------|
| S1 | **President decision inbox** (split view) | Salesforce Service Console | President, VP |
| S2 | **Treasurer verification queue** | SAP FI posting queue | Treasurer |
| S3 | **Care case desk** (state + SLA) | ServiceNow | Care/welfare |
| S4 | **Effective permissions union** (custom roles in auth) | Entra RBAC | Advisor, all |
| S5 | **Composable capability registry** (one map, all seats) | SAP Launchpad | Advisor, custom |

### Tier A — strong committee credibility (Wave C2)

| # | Feature | Primary reference | Roles |
|---|---------|-------------------|-------|
| A6 | **VP delegation routing** | Power Automate | VP, president |
| A7 | **3-widget homes** per fixed seat | Infor OS | All fixed seats |
| A8 | **Member 360** from join queue | Salesforce | President, VP, care |
| A9 | **Period close checklist** | SAP FI month-end | Treasurer |
| A10 | **SoD warnings** on role edit | SAP GRC | President, governance |

### Tier B — polish and scale (Wave C3)

| # | Feature | Primary reference | Roles |
|---|---------|-------------------|-------|
| B11 | **Officer SLA dashboard** on president home | ServiceNow | President |
| B12 | **Effective-dated committee assignments** | Workday | Governance |
| B13 | **Executive export pack** (PDF) | Power BI | President, treasurer |
| B14 | **Music notify delivery tracking** | Planning Center | Music director |
| B15 | **Mobile stacked queues** | Fiori | President, treasurer, care |

### Tier C — later / optional (Wave C4)

| # | Feature | Primary reference | Notes |
|---|---------|-------------------|-------|
| C16 | Time-bound advisor elevation | Entra PIM | “Finance read for 7 days” |
| C17 | Custom role templates library | SAP GRC role templates | Share “Development Advisor” across choirs |
| C18 | Choir executive pulse survey | Viva | Leadership team health |
| ~~C19~~ | ~~AI meeting summaries~~ | — | **Deferred** |

---

## 10. What not to build

- Don’t treat **Advisor** as a fixed module bundle  
- Don’t duplicate **Family head** desk under committee `family_head` hub  
- Don’t merge **treasurer verification** into president hub  
- Don’t show **disabled** buttons for unauthorized committee actions — hide  
- Don’t clone full **ServiceNow** or **SAP FI** — narrow queues only  
- Don’t let **custom roles** bypass audit  
- Don’t build **AI summaries** until explicitly prioritized

---

## 11. Current state vs target

| Built today | Target (this spec) |
|-------------|-------------------|
| Hub pages + tabs per seat (`ChoirPositionHubShell`) | **Primary queue/desk** per seat |
| Advisor capability panel (permission → links) | Extend to **auth union + custom roles** |
| Per-choir `permissionsJson` via governance | **SoD warnings + audit diff** |
| `ChoirCustomRole` CRUD + assignments | Surface in **dashboard context + /auth/me** |
| Card grids linking to modules | **3-widget homes** + actionable widgets |
| President/treasurer share finance **view** | **Verification queue** separates duties |
| Care/discipline as pages | **Case desk** with SLA |
| Family head committee role in seed | **Redirect** to Family leadership only |

**Phase 0 (now):** Routing, hub shells, advisor composable panel, governance API, custom roles schema.  
**Phase C1 target:** Tier S — inbox, queues, permission union.

---

## 12. Implementation phasing

| Wave | Tiers | Focus |
|------|-------|-------|
| **C0 (now)** | — | Spec, advisor model documented, gap list |
| **C1** | Tier S | President inbox, treasurer queue, case desk, custom role auth union |
| **C2** | Tier A | VP delegation, 3-widget homes, SoD warnings, member 360 |
| **C3** | Tier B | SLA dashboard, effective dating, export packs, mobile queues |
| **C4** | Tier C | Time-bound elevation, role template library, pulse |

Align with Family waves: Family **Wave 2–4** delivered family department depth; Committee **C1–C4** delivers executive layer without merging into family offices.

---

## 13. Screen-by-screen spec order

| # | Spec | Status |
|---|------|--------|
| 1 | **Committee positions** (this document) | **Done** |
| 2 | [**President decision console**](PRESIDENT_DECISION_CONSOLE_SPEC.md) (Salesforce + join workflow) | **Done** |
| 3 | [**Treasurer verification console**](TREASURER_VERIFICATION_CONSOLE_SPEC.md) (SAP FI queue) | **Done** |
| 4 | Care case desk (ServiceNow) | Next |
| 5 | Composable access & custom roles (SAP GRC) | Planned |
| 6 | VP delegation (Power Automate) | Planned |

Each child spec must cite: **role seat**, **module**, **tier item(s)**, and **external import(s)**.

---

## 14. Relationship to Family Department

```
┌──────────────────────┐     ┌──────────────────────┐
│  COMMITTEE LAYER     │     │  FAMILY DEPARTMENT   │
│  choir:{id} scope    │     │  family:{id} scope   │
├──────────────────────┤     ├──────────────────────┤
│ President, VP, …     │     │ Head, deputy, sec    │
│ Treasurer (verify)   │────▶│ Head (approve claim) │
│ Family coordinator   │     │ Member (submit)      │
│ Advisor (∗ perms)    │     │                      │
└──────────────────────┘     └──────────────────────┘
         │                              │
         └──────── same person ─────────┘
              two nav entries, never merged hubs
```

**Money path:** Member submit → **Family head approve** → **Treasurer verify** (committee). Specs: [`MEMBER_OBLIGATIONS_GIVING_SPEC.md`](MEMBER_OBLIGATIONS_GIVING_SPEC.md), [`FAMILY_HEAD_DECISION_CONSOLE_SPEC.md`](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md).

---

## 15. Code anchors (implementation)

| Concern | Location |
|---------|----------|
| Default committee templates | `backend/prisma/seed.ts` → `DEFAULT_CHOIR_COMMITTEE_ROLES` |
| Per-choir role edit | `backend/src/governance/governance.service.ts` |
| Custom roles | `backend/src/choir-custom-roles/` |
| Dashboard context | `backend/src/member-portal/choir-dashboard-context.service.ts` |
| Hub path map | `web/lib/choir/officer-roles.ts` |
| Advisor capability map | `web/components/choir/AdvisorCapabilityPanel.tsx` |
| Position meta / guide | `web/lib/constants/choir-positions.ts` |
| Membership Office tab (dual hat) | `web/lib/choir/member-leadership-offices.ts` |

**Immediate engineering gap (C1):** Union `ChoirMemberCustomRole` permissions in `PermissionsResolver` and expose `customRoles[]` on `ChoirDashboardContext` so advisor/custom desks match API enforcement.
