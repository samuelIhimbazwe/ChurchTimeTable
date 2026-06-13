# President — Decision Console (Screen-by-Screen Spec)

Wave **C1** primary surface for the **President office** (VP reuses with delegation — see §9). Implements Committee Tier **S1** (decision inbox split view), partial **A8** (Member 360), **A10** (review macros), **B11** (officer SLA widget on Command home), and **B14** (oldest-pending aging).

**Parent spec:** [`COMMITTEE_POSITIONS_SPEC.md`](COMMITTEE_POSITIONS_SPEC.md)  
**Parallel:** [`FAMILY_HEAD_DECISION_CONSOLE_SPEC.md`](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md) (money stays in Family Department)

Last updated: June 2026

---

## 1. Purpose and north star

**North star:** “Show me what needs my decision today across people, policy, and choir health.”

The President Decision Console is the executive **daily work surface** — not `ChoirExecutiveHubContent` card grids, not a buried join-requests page. It combines:

| Reference | Pattern borrowed |
|-----------|------------------|
| **Salesforce Service Console** | Split view: queue left, request workspace right; wrap-up to next item |
| **Workday onboarding** | Join review with position assignment and requirements loop |
| **Power Automate** | Approve / reject / needs-info with audit and notifications |
| **SAP Fiori** | Mobile: stacked list → detail → back |
| **Infor OS Workspace** | Command home links into console via actionable widget |
| **Viva Insights** | Choir health widget — aggregates only, not approvals |

**Treasurer boundary:** President does **not** confirm umusanzu or post ledger entries. Money oversight = read-only KPI + link to treasurer desk.

**VP reuse:** Same console UI at `/vice-president/decisions`. Queue routing differs when delegation is off (§9).

---

## 2. Route and navigation

### 2.1 Canonical routes

| Screen | Route | Nav label | Default for |
|--------|-------|-----------|-------------|
| Command home | `/choir/{choirId}/president` | Overview | President when `pendingCount = 0` |
| **Decision Console** | `/choir/{choirId}/president/decisions` | **Decisions** | President when `pendingCount > 0` |
| Join requests (legacy) | `/choir/{choirId}/join-requests` | — | **301 redirect** to `/president/decisions?queue=join` |
| Officer hubs / governance | existing segments | Governance, etc. | Secondary |

**VP:** replace `president` with `vice-president`.

### 2.2 URL parameters

| Param | Purpose | Example |
|-------|---------|---------|
| `requestId` | Deep-link selected join request | `?requestId=uuid` |
| `queue` | Active queue tab | `join` (v1 only) · `escalations` (v2) |
| `member360` | Open Member 360 | `?requestId=uuid&member360=1` |

Notification deep links (`choir_join_request_admin`) **must** use `/president/decisions?requestId=`.

### 2.3 Hub shell nav change

Replace empty tabs on `ChoirPositionHubShell` with office nav:

```
Overview → Decisions → Governance → …
```

Badge on **Decisions** = `pendingJoinCount + pendingEscalationCount` (v1: join only).

### 2.4 Entry behavior

| Condition | Landing |
|-----------|---------|
| President opens `/president` and `pendingJoinCount > 0` | Redirect to `/president/decisions` |
| President opens `/president` and no pending work | Stay on Command home (3 widgets) |
| WhatsApp / in-app “New join request” | `/president/decisions?requestId=` |
| VP with delegation off and pending joins | `/vice-president` overview only; Decisions shows read-only queue |

---

## 3. Information architecture

```
President office
├── Command home              (3 widgets — Infor)
├── Decision Console ★        (split inbox — Salesforce)  ← THIS SPEC
│   ├── Queue pane (join v1)
│   ├── Request workspace
│   │   ├── Highlights panel
│   │   ├── Applicant context strip
│   │   ├── Reason & history
│   │   ├── Position assignment
│   │   └── Action panel
│   ├── Quick actions (macros)
│   └── Utility bar
├── Member 360 slide-over     (SAP People Profile)
└── Governance / officer hubs (secondary — demoted)
```

**v2 queues (same console shell):** welfare escalations, discipline escalations, stale join SLA breaches.

---

## 4. Screen A — Command home (redesigned)

**Route:** `/president`  
**Reference:** Infor OS Workspace  
**Tier:** A7 (3-widget persona home)

### 4.1 Layout

Exactly **3 widgets** — replace stat grid + quick-link cards in `ChoirExecutiveHubContent`.

```
┌─────────────────────────────────────────────────────────────┐
│  President · {choirName}                                     │
├─────────────────────────────────────────────────────────────┤
│  [W1 Decisions]  [W2 Choir health]  [W3 Officer SLA]        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Widget 1 — Decision inbox (primary)

| Field | Source | Display |
|-------|--------|---------|
| Pending join count | `joinRequests.filter(PENDING \| NEEDS_INFO).length` | Large number |
| Oldest pending age | `min(now - createdAt)` | “Oldest: 3 days” |
| CTA | — | “Open decisions →” |

**Click:** `/president/decisions`.

**Empty:** “No membership decisions today” + link to members roster.

### 4.3 Widget 2 — Choir health (read-only)

| Field | Source | Display |
|-------|--------|---------|
| Attendance rate | `choirSchedulingApi.getLeaderDashboard` | `72%` |
| Campaign progress | `financeApi.getStewardshipAnalytics` | Single line `%` |
| Giving note | — | “Treasurer verifies money” subtext |

**Click:** `/reports` or `/budget` (view-only for president).

**Reference:** Viva executive tile — aggregates, no member names.

### 4.4 Widget 3 — Officer SLA (v2 partial in v1)

| Field | Source | Display |
|-------|--------|---------|
| Open care cases | discipline/welfare API (future) | Count or “—” |
| Stale joins > 48h | derived from join list | Count |
| CTA | — | “View escalations →” (v2) |

**v1:** Show stale join count only; hide care until case desk ships.

### 4.5 Permissions

| Actor | Widget 1 |
|-------|----------|
| President | Full approve actions |
| VP (delegated) | “Open decisions” — approve enabled |
| VP (not delegated) | “View pending” — read-only console |

---

## 5. Screen B — Decision Console (split view)

**Route:** `/president/decisions`  
**Reference:** Salesforce Service Console + Workday onboarding  
**Tier:** S1, B14

Replaces expandable cards on `join-requests/page.tsx`.

### 5.1 Desktop layout (≥ lg)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ President · Decisions                                                     │
├───────────────────────┬──────────────────────────────────────────────────┤
│ QUEUE (320–380px)     │ REQUEST WORKSPACE (flex)                          │
│ Join requests (4)     │ HIGHLIGHTS PANEL                                │
│ Sort: Oldest ▾        │ JR-2026-0042 · PENDING · Permanent member       │
│ ┌─────────────────┐   │ Applicant · Type · Submitted · Choir            │
│ │● Jane Doe · 3d  │   ├──────────────────────────────────────────────────┤
│ └─────────────────┘   │ APPLICANT CONTEXT (360 strip)                   │
│ ┌─────────────────┐   │ Other choirs · Sponsor status · Member #        │
│ │  John … · 1d   │   ├──────────────────────────────────────────────────┤
│ └─────────────────┘   │ REASON & PRIOR REVIEW                           │
│                       ├──────────────────────────────────────────────────┤
│                       │ POSITION ASSIGNMENT (on approve path)             │
│                       ├──────────────────────────────────────────────────┤
│                       │ ACTION PANEL                                      │
├───────────────────────┴──────────────────────────────────────────────────┤
│ UTILITY: Membership rules · Copy link · Open full roster                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Queue pane

#### Header

| Element | Behavior |
|---------|----------|
| Title | “Join requests” (v1 single queue) |
| Count badge | Pending + NEEDS_INFO |
| Sort | Default **Oldest first** (`createdAt asc`) |
| Filter | v1: status implicit · v2: request type |

#### Queue row

| Field | Source | Notes |
|-------|--------|-------|
| Selection indicator | UI | Left border when selected |
| Applicant | `member.firstName lastName` | Avatar optional |
| Request type | `requestType` | Badge: Permanent / Yerusalemu / etc. |
| Age | `createdAt` | Relative |
| Status chip | `PENDING` / `NEEDS_INFO` | NEEDS_INFO = accent |

**Row click:** selects request; updates `?requestId=`; loads workspace.

#### Queue empty state

```
✓  No pending join requests

Review members roster →   View recent approvals →
```

---

## 6. Screen C — Request workspace (detail pane)

**Reference:** Salesforce primary tab + Workday offer management  
**Tier:** A8, A10

### 6.1 Highlights panel

| Field | Source |
|-------|--------|
| Request ID | `id` (short display) |
| Status | `PENDING` / `NEEDS_INFO` |
| Request type | `requestType` label |
| Applicant | member name + link → Member 360 |
| Choir | `choir.name` |
| Submitted | `createdAt` |
| Prior review | `reviewedAt`, `reviewNotes` if NEEDS_INFO |

### 6.2 Applicant context strip (360 lite)

| Field | Source | Display |
|-------|--------|---------|
| Member number | member record | If exists |
| Other choir memberships | **New API or** membership rules | “Also in: …” or “New to church” |
| Active sponsor conflict | rules service | Warning if would block |
| Pending elsewhere | join service rules | Warning banner |

**Action:** “View applicant →” opens Member 360.

### 6.3 Reason and notes

| Field | Source |
|-------|--------|
| Applicant reason | `reason` |
| Requirements sent | `reviewNotes` when NEEDS_INFO |
| Audit | future timeline API |

### 6.4 Position assignment (approve path)

Shown in workspace (not buried in expand):

| Field | Type | Behavior |
|-------|------|----------|
| Assign position | select | Options from `GET /choirs/.../position-roles` |
| Default | `choir_member` role pre-selected | |
| Guide | `ChoirPositionGuide` | Inline when role selected |

**Macro “Approve as member”:** skips position picker; uses default member role only.

### 6.5 Action panel

#### President / delegated VP (`canReviewJoin = true`)

**Quick actions (A10):**

| Button | Behavior |
|--------|----------|
| **Approve as member** | `APPROVED` + default `choir_member` role |
| **Approve with position** | Requires position selected → `APPROVED` + `assignedRoleId` |
| **Send requirements** | Expands form; `NEEDS_INFO` + required `reviewNotes` |
| **Reject** | Expands form; optional/required notes |

**Reject templates:**

- “Audition required first”
- “Membership full in your voice section”
- “Please contact the secretary”

**Approve macro side effects (existing backend):**

- Creates choir membership (`MEMBER`)
- Optional committee role assignment
- Notifies applicant (`notifyJoinRequestReviewed`)
- Audit `JOIN_REQUEST_REVIEWED`

#### View-only VP

Escalation card — same pattern as family deputy (no disabled buttons):

```
You cannot approve join requests

The President has not delegated membership decisions to you.
Pending requests are waiting for {presidentName}.
```

#### Post-action wrap-up

1. Toast success  
2. Remove from queue; refetch  
3. **Auto-select next** oldest request  
4. Update URL to next `requestId` or clear param  

---

## 7. Screen D — Member 360 slide-over

**Reference:** SAP People Profile  
**Tier:** A8

**Tabs (v1):**

| Tab | Content |
|-----|---------|
| **Profile** | Name, phone, member number |
| **Membership** | Choir memberships, join history |
| **Context** | Sponsor status, pending requests |

**Take Action footer:**

- Select this request in console  
- Open members roster filtered  

**API composition (v1):** join row + `choirApi.getMembers` search + membership rules endpoint.

---

## 8. Utility bar

| Tool | Behavior |
|------|----------|
| **Membership rules** | Popover from `getMembershipRules()` |
| **Copy request link** | Deep link for VP/advisor discussion |
| **Open roster** | `/members` |
| **WhatsApp applicant** | `tel:` if phone on member record |

---

## 9. VP variant

**Route:** `/vice-president/decisions`

| `presidentDelegation.joinReview` | Console behavior |
|----------------------------------|------------------|
| `true` | Full approve; badge “Acting for President” |
| `false` | Read-only queue + escalation card |

**Backend gap:** Add `presidentOutOfOffice` + delegation flags to choir governance or dashboard context (Power Automate pattern). Until then, infer from VP permission template (`choir.join.review` present).

---

## 10. Mobile behavior (Fiori stacked)

| Step | Screen |
|------|--------|
| 1 | Full-width queue |
| 2 | Tap → full-screen workspace + back |
| 3 | Member 360 → sheet |
| 4 | After action → queue with wrap-up |

**Sticky footer:** Approve as member + Reject; other actions in overflow.

---

## 11. Permissions matrix

| UI element | President | VP delegated | VP not delegated |
|------------|-----------|--------------|------------------|
| Decisions nav + badge | ✓ | ✓ | ✓ (count only) |
| Queue | ✓ | ✓ | ✓ read-only |
| Approve / reject / needs-info | ✓ | ✓ | hidden |
| Member 360 | ✓ | ✓ | ✓ |
| Position assignment | ✓ | ✓ | hidden |

**API:** `choir.join.review` | `member:manage` | `choir.operations.manage` (existing `canReview`).

---

## 12. API mapping

### 12.1 Existing endpoints

| Purpose | Endpoint |
|---------|----------|
| List requests | `GET /choirs/join-requests?choirId=&status=` |
| Review | `PATCH /choirs/join-requests/:id` body `{ status, reviewNotes, assignedRoleId }` |
| Position roles | `GET /choirs/:choirId/position-roles` (via join service) |
| Leader KPIs | `GET /choir/scheduling/leader-dashboard/:choirId` |
| Stewardship summary | `GET /finance/stewardship/analytics?ministryScope=CHOIR` |

### 12.2 Gaps for full spec

| Gap | Needed for | Proposed |
|-----|------------|----------|
| `GET /choirs/join-requests/inbox?choirId=` | Queue counts, oldest age, stable sort | Wrap list + `pendingCount`, `oldestPendingAt` |
| Join request timeline | Workspace audit feed | Reuse audit read filtered by entity |
| Applicant membership snapshot | 360 strip | `GET /members/:id/choir-context` |
| President dashboard KPI | Command home single call | `GET /choir/:choirId/president/dashboard` |
| VP delegation flag | §9 | Extend `ChoirDashboardContext` or governance settings |
| Notification `actionUrl` | Deep link | Already `choirJoinRequests(choirId, requestId)` — point to `/president/decisions?requestId=` |

### 12.3 Error handling

| API | UI |
|-----|-----|
| Review 400 (needs_info without notes) | Inline on requirements field |
| Review 403 | Toast + escalation card refresh |
| Review 409 (already processed) | Remove row; select next |
| Rules validation on approve | Banner with rule message |

---

## 13. Acceptance criteria

### 13.1 President happy path

1. President with 4 pending joins lands on `/decisions`; oldest auto-selected.  
2. **Approve as member** → membership created → applicant notified → next request selected without modal.  
3. Position guide visible when assigning officer role before approve.  

### 13.2 Needs info loop

1. President sends requirements → status NEEDS_INFO → applicant notified.  
2. When applicant resubmits (future) or president reopens → same workspace shows prior notes.  

### 13.3 VP

1. Delegated VP can approve; non-delegated sees escalation only.  
2. No disabled approve buttons anywhere.  

### 13.4 Security

1. Reviewer cannot approve requests for choirs outside their scope.  
2. Assigning treasurer role to self triggers SoD warning (future GRC).  

---

## 14. Current code vs target

| Today | Target |
|-------|--------|
| `ChoirExecutiveHubContent` stat grid + links | 3-widget Command home |
| `join-requests/page.tsx` expandable cards | Split Decision Console |
| Notification links to join-requests page | Links to `/president/decisions?requestId=` |
| VP uses same hub as president | Delegation-aware console |
| No wrap-up auto-next | Salesforce wrap-up flow |

**Primary files (implementation reference):**

- New: `web/app/.../president/decisions/page.tsx`  
- New: `web/components/choir/committee/PresidentDecisionConsole.tsx`  
- New: `web/components/choir/committee/Applicant360Panel.tsx`  
- Update: `web/app/.../president/page.tsx` — Command home  
- Update: `web/components/choir/ChoirExecutiveHubContent.tsx` — extract widgets or replace  
- Redirect: `join-requests/page.tsx` → decisions with query param  

---

## 15. Tier coverage

| Tier ID | Feature | Section |
|---------|---------|---------|
| S1 | Decision inbox split view | §5–6 |
| A7 | 3-widget Command home | §4 |
| A8 | Member / applicant 360 | §6.2, §7 |
| A10 | Review macros | §6.5 |
| B11 | Officer SLA widget | §4.4 |
| B14 | Oldest pending aging | §4.2, §5.2 |

---

## 16. Next specs

1. [`TREASURER_VERIFICATION_CONSOLE_SPEC.md`](TREASURER_VERIFICATION_CONSOLE_SPEC.md) — money verification (SAP FI)  
2. Care case desk (ServiceNow)  
3. VP delegation workflow (Power Automate)
