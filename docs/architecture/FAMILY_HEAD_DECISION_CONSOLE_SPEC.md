# Family Head — Decision Console (Screen-by-Screen Spec)

Wave 2 primary surface for the **Family leadership office**. Implements Tier **S1** (Decision inbox split view), **S4** (claim timeline + audit), partial **A6** (Member 360), partial **A10** (quick actions), and **B14** (oldest-pending aging KPI).

**Parent spec:** [`FAMILY_DEPARTMENT_SPEC.md`](FAMILY_DEPARTMENT_SPEC.md)  
**API contract:** [`API_CONTRACT_CONTRIBUTIONS_v1.md`](../pilot/API_CONTRACT_CONTRIBUTIONS_v1.md)

Last updated: June 2026

---

## 1. Purpose and north star

**North star:** “Show me what needs my decision today; one click to confirm with full context.”

The Decision Console is the family head’s **daily work surface** — not a dashboard of cards, not a tab buried under Contributions. It combines:

| Reference | Pattern borrowed |
|-----------|------------------|
| **Salesforce Service Console** | Split view: queue left, claim workspace right; wrap-up to next item |
| **SAP SuccessFactors MSS** | Take Action on a team member from claim context |
| **Power Automate** | Approve / partial / reject with required reasons and audit |
| **SAP Fiori** | Mobile: stacked list → detail → back |
| **Infor OS Workspace** | Command home links into console via actionable widget |

**Deputy reuse:** Same console UI at `/family-deputy/decisions`. Permission profile differs (delegation ON/OFF). Spec sections mark deputy-only behavior.

---

## 2. Route and navigation

### 2.1 Canonical routes

| Screen | Route | Nav label | Default for |
|--------|-------|-----------|-------------|
| Command home | `/choir/{choirId}/family-leadership` | Command | Head when `pendingCount = 0` |
| **Decision Console** | `/choir/{choirId}/family-leadership/decisions` | **Decisions** | Head when `pendingCount > 0` |
| Contributions (secondary) | `/choir/{choirId}/family-leadership/contributions` | Contributions | Overview, progress, ledger |
| Payment settings | `/choir/{choirId}/family-leadership/settings` | Payment settings | Head only |

**Deputy:** replace `family-leadership` with `family-deputy`; no Settings nav item.

### 2.2 URL parameters (Decision Console)

| Param | Purpose | Example |
|-------|---------|---------|
| `claimId` | Deep-link selected claim | `?claimId=uuid` |
| `memberId` | Open Member 360 for member | `?claimId=uuid&member360=1` |

Legacy `contributions?ftab=pending&claimId=` **301/redirect** to `/decisions?claimId=`.

### 2.3 Office nav change (family-leadership)

Insert **Decisions** as second item (after Command):

```
Command → Decisions → Contributions → My team → …
```

Badge on **Decisions** tab = `pendingCount` when > 0.

### 2.4 Entry behavior

| Condition | Landing |
|-----------|---------|
| Head opens office root `/family-leadership` and `pendingCount > 0` | Redirect to `/decisions` (or Command shows primary widget only — pick one; **recommended: redirect**) |
| Head opens office root and `pendingCount = 0` | Stay on Command home |
| Head clicks “Decisions awaiting” widget | `/decisions` |
| Notification deep link “3 claims waiting” | `/decisions` |

---

## 3. Information architecture

```
Family leadership office
├── Command home          (3 widgets — Infor)
├── Decision Console ★    (split inbox — Salesforce)  ← THIS SPEC
│   ├── Queue pane
│   ├── Claim workspace
│   │   ├── Highlights panel
│   │   ├── Member context strip
│   │   ├── Proof & notes
│   │   ├── Timeline
│   │   └── Action panel (approve / reject)
│   ├── Quick actions bar
│   └── Utility bar
├── Member 360 slide-over (SAP People Profile)
└── Contributions hub     (tabs: overview, progress, ledger — demoted)
```

---

## 4. Screen A — Command home (redesigned)

**Route:** `/family-leadership`  
**Reference:** Infor OS Workspace (3-widget persona home)  
**Tier:** A9 (partial — console widget satisfies S1 entry)

### 4.1 Layout

Exactly **3 widgets**, no stat grid, no “This week” list on v1 console wave.

```
┌─────────────────────────────────────────────────────────────┐
│  Family command · {familyName}                               │
├─────────────────────────────────────────────────────────────┤
│  [W1 Decision inbox]  [W2 Family goal]  [W3 Team health]    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Widget 1 — Decision inbox (primary)

| Field | Source | Display |
|-------|--------|---------|
| Pending count | `dashboard.pendingCount` | Large number |
| Oldest pending age | `min(now - item.createdAt)` from inbox | “Oldest: 2 days” or “Oldest: 4 hours” |
| CTA | — | “Open decisions →” |

**Click:** navigates to `/decisions`. If `pendingCount = 0`, widget shows green check + “No decisions today” and links to `/contributions?ftab=progress`.

**Empty copy:** “No payment claims waiting for your confirmation.”

### 4.3 Widget 2 — Family goal

| Field | Source | Display |
|-------|--------|---------|
| Campaign name | `dashboard.campaign.name` | Subtitle |
| Collected / goal | `collectedEffective` / `campaign.familyGoalAmount` | `RWF … / RWF …` |
| Progress bar | `progressPct` | Single bar |

**Click:** `/contributions?ftab=overview`.

### 4.4 Widget 3 — Team health

| Field | Source | Display |
|-------|--------|---------|
| Behind + none | `summary.membersBehindTarget + membersWithNoContribution` | Count |
| Grade (if available) | `familiesApi.getMetrics().health.grade` | Badge A–F |
| Suggested action | Derived | “{n} members need follow-up” |

**Click:** `/contributions?ftab=progress`.

### 4.5 Permissions

| Actor | Widget 1 CTA |
|-------|--------------|
| Head | Full — opens console with approve actions |
| Deputy (delegated) | “Open decisions” — approve enabled |
| Deputy (not delegated) | “View pending” — read-only console |
| Secretary | N/A — uses Progress desk home, not this screen |

### 4.6 Empty / error states

| State | UI |
|-------|-----|
| No family assigned | Center card: “No family assigned.” |
| Dashboard loading | Skeleton 3-column |
| Dashboard API 404 | “You don’t have access to this family office.” |
| Dashboard API 5xx | Error banner + retry |

---

## 5. Screen B — Decision Console (split view)

**Route:** `/family-leadership/decisions`  
**Reference:** Salesforce Service Console  
**Tier:** S1, S4, B14

This is the **primary implementation target**. Replaces today’s `contributions?ftab=pending` table + modal pattern.

### 5.1 Desktop layout (≥ lg, 1024px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Office hero + sticky tabs (existing OfficeShellFrame)                     │
├───────────────────────┬──────────────────────────────────────────────────┤
│ QUEUE (320–380px)     │ CLAIM WORKSPACE (flex)                            │
│ ─────────────────     │ ──────────────────────────────────────────────── │
│ Pending (3) · Sort ▾  │ HIGHLIGHTS PANEL                                │
│ ┌─────────────────┐   │ CNT-2026-00142 · Waiting · Grace seed           │
│ │● CNT-… 10,000   │   │ Member · Amount · Date · Channel · Family       │
│ │  Jane · 2d       │   ├──────────────────────────────────────────────────┤
│ └─────────────────┘   │ MEMBER CONTEXT (360 strip)                        │
│ ┌─────────────────┐   │ Goal 72% · 2 prior claims · Last attendance …     │
│ │  CNT-… 5,000    │   ├──────────────────────────────────────────────────┤
│ └─────────────────┘   │ PROOF & NOTES                                     │
│                       ├──────────────────────────────────────────────────┤
│                       │ TIMELINE                                          │
│                       ├──────────────────────────────────────────────────┤
│                       │ ACTION PANEL                                      │
├───────────────────────┴──────────────────────────────────────────────────┤
│ UTILITY BAR: Payment instructions · Call member · Family goal            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Queue pane

#### Header

| Element | Behavior |
|---------|----------|
| Title | “Pending decisions” |
| Count badge | `inbox.pendingCount` |
| Sort | Default **Oldest first** (`createdAt asc` — matches API). Optional: Amount high→low |
| Filter | v1: none. v2: by campaign |

#### Queue row (list item)

| Column / field | Source | Notes |
|----------------|--------|-------|
| Selection indicator | UI | Left border primary when selected |
| Reference # | `item.referenceNumber` | Monospace |
| Member | `memberNumber` + `memberName` | Truncate long names |
| Amount | `claimedAmount` | Right-aligned, `formatCurrency` |
| Age | `createdAt` | Relative: “2d”, “4h”, “Just now” |
| Status chip | `status` | Always “Waiting” for SUBMITTED |

**Row click:** selects claim; updates URL `?claimId=`; loads workspace (no full page nav).

**Keyboard:** ↑/↓ moves selection; Enter focuses action panel.

#### Queue empty state

```
✓  No pending claims

All member payments are confirmed for now.
View family progress →   View ledger →
```

Links: `/contributions?ftab=progress`, `/contributions?ftab=ledger`.

#### Queue loading / error

| State | UI |
|-------|-----|
| Loading | 5 skeleton rows |
| Empty inbox but dashboard `pendingCount > 0` | Refetch banner (stale cache) |
| 403 | “You cannot view this family’s inbox.” |
| 404 | Hidden — redirect to portal |

---

## 6. Screen C — Claim workspace (detail pane)

**Reference:** Salesforce primary tab + highlights panel + timeline feed  
**Tier:** S4, A6 (strip), A10 (actions)

Shown in right pane when a queue item is selected. On mobile, full-page detail (see §10).

### 6.1 Highlights panel (always visible at top)

Fixed strip — does not scroll away.

| Field | Source | Format |
|-------|--------|--------|
| Reference # | `referenceNumber` | `CNT-…` |
| Status | `status` | Badge “Waiting for family confirmation” |
| Contribution type | `typeName` or `campaignName` | “Grace seed · March campaign” |
| Member | `memberNumber`, `memberName` | Link → opens Member 360 |
| Claimed amount | `claimedAmount` | Bold `RWF` |
| Payment date | `paymentAt` | `formatDate` or “—” |
| Channel | `paymentChannel` | MoMo / Bank / Other |
| Family | `dashboard.familyName` | Read-only |
| Submitted | `createdAt` | Relative + absolute on hover |

### 6.2 Member context strip (360 lite)

**Reference:** SAP People Profile quick card  
**Tier:** A6 (full slide-over in §7)

Horizontal strip below highlights:

| Field | Source | Display |
|-------|--------|---------|
| Campaign progress | `GET family/member-progress` row for `memberId` | “Goal: 72%” |
| Confirmed this campaign | same row `confirmedEffective` | `RWF …` |
| Pending claims count | Count inbox items for member | “1 pending” |
| Last attendance | **New API** or metrics | “Last seen: 12 Mar” or “—” |
| Action | — | “View member →” opens Member 360 |

If member-progress row missing, show “No goal set for this campaign.”

### 6.3 Proof and notes section

| Field | Source | Display |
|-------|--------|---------|
| Member phone | `memberPhone` | Tap-to-call on mobile |
| Receipt | `receiptUrl` | Link “View receipt” opens new tab; hidden if null |
| Member note | `notes` | Block quote; hidden if empty |
| Payment instructions reminder | Family payment settings | Collapsible: MoMo / bank from family record |

### 6.4 Timeline section

**API:** `GET /finance/contributions/:id/timeline`

| Event type | Summary example |
|------------|-----------------|
| `submitted` | “Jane Doe submitted RWF 10,000” |
| `approved` | “Confirmed by Head Joseph” |
| `rejected` | “Rejected: amount mismatch” |
| `thank_you_sent` | “Thank-you SMS sent” |

Display: vertical feed, newest at bottom; icon per type; timestamp + actor when present.

**Loading:** skeleton 3 lines.  
**Empty:** “No activity recorded yet.” (should not happen for SUBMITTED claims with submit event)

### 6.5 Action panel

**Reference:** Power Automate approval response + Salesforce macros

#### Head / delegated deputy (`canApprove = true`)

**Quick actions row (A10):**

| Button | Behavior |
|--------|----------|
| **Approve full** | Sets confirmed amount = claimed amount; submits immediately |
| **Approve partial** | Expands inline form (see below) |
| **Reject** | Expands reject form |

**Approve full confirmation:** Optional lightweight confirm for amounts ≥ `familyApprovalThreshold` (v2; v1 can skip).

**Partial approve form:**

| Field | Type | Validation | API field |
|-------|------|------------|-----------|
| Amount received | number | > 0, ≤ claimed (soft warn if > claimed) | `confirmedAmount` |
| Reason for difference | textarea | Required if ≠ claimed, min 3 chars | `discrepancyReason` |
| Submit | button | — | `POST …/family/approve` |

**Reject form:**

| Field | Type | Validation | API field |
|-------|------|------------|-----------|
| Reason | textarea | Required, min 3 chars | `rejectionReason` |
| Submit | button | Destructive style | `POST …/family/reject` |

**Reject templates (A10 quick picks):**

- “Amount not received”
- “Wrong payment reference”
- “Please resubmit with receipt”

Selecting a template prefills textarea; user may edit before submit.

#### View-only deputy / secretary (`canApprove = false`)

**Do not show disabled buttons.** Show escalation card:

```
You cannot confirm payments

This family has not enabled deputy approval.
Pending claims are waiting for {headName}.

[View family progress]   [Contact head]
```

`headName` from family leadership context or team API.

#### Post-action wrap-up (Salesforce)

On successful approve or reject:

1. Toast: “Contribution confirmed” / “Claim rejected”
2. Remove item from queue; refetch inbox + dashboard
3. **Auto-select next** pending item (oldest remaining)
4. If queue empty → show queue empty state in pane + optional confetti-free success message
5. Update URL: next `claimId` or remove param

**Concurrent edit:** If API returns 409/400 “already processed”, toast + remove stale row + select next.

---

## 7. Screen D — Member 360 slide-over

**Reference:** SAP People Profile / Quick Card  
**Tier:** A6  
**Trigger:** Click member name in highlights or “View member →” in context strip

### 7.1 Layout

Right slide-over (desktop, 480px) or full-screen sheet (mobile).

**Tabs:**

| Tab | Content |
|-----|---------|
| **Giving** | Campaign progress bar, confirmed effective, remaining, link to member’s claims in ledger filtered |
| **Claims** | Last 5 contribution records for member in this family (any status) |
| **Attendance** | Last 3 activities marked present/absent — **needs API** or reuse participation endpoint |
| **Contact** | Phone, member number; “Call” / “Copy” actions |

### 7.2 Take Action footer (SAP MSS)

| Action | Visible | Behavior |
|--------|---------|----------|
| View pending claim | If member has item in current queue | Selects that claim in console |
| Open progress row | Always | Closes 360; navigates to contributions progress filtered by `memberId` |
| Add follow-up note | v2 | Secretary/head note on member |

### 7.3 Permissions

| Role | Member 360 |
|------|------------|
| Head | Full |
| Deputy | Full (read); Take Action approve only if delegated |
| Secretary | Full read; no approve actions in footer |

### 7.4 API composition (v1)

No new endpoint required for MVP if composed client-side:

| Tab | APIs |
|-----|------|
| Giving | `GET family/member-progress` + filter |
| Claims | `GET family/ledger?memberId=` ( **gap:** add query filter ) or client filter |
| Attendance | `GET families/:id/metrics` per member — **gap:** member-scoped attendance |
| Contact | From inbox/ledger row fields |

Document **API gaps** in §12.

---

## 8. Utility bar

**Reference:** Salesforce utility bar  
**Position:** Fixed bottom of console (desktop) or overflow menu (mobile)

| Tool | Behavior | Permission |
|------|----------|------------|
| **Payment instructions** | Slide-up panel: family MoMo, bank, notes from payment settings | All family leadership roles |
| **Call member** | `tel:{memberPhone}` | Hidden if no phone |
| **Family goal** | Mini popover: goal %, collected, remaining | All |
| **Copy reference** | Copies `referenceNumber` | All |

---

## 9. Deputy variant (same console)

**Route:** `/family-deputy/decisions`

| `delegationEnabled` | `canApprove` | Console behavior |
|---------------------|--------------|------------------|
| `true` | `true` | Identical to head; badge in hero: “Acting approver” |
| `false` | `false` | Queue visible; action panel = escalation card only |

**Mid-session toggle:** If head enables delegation while deputy has console open, refetch `family/context` and enable action panel without full reload.

**Audit display:** Timeline shows “Confirmed by Deputy …” with `familyApprovedByName` from API response.

---

## 10. Mobile behavior (Fiori stacked)

**Breakpoint:** `< lg` (1024px)

| Step | Screen |
|------|--------|
| 1 | Full-width queue list (same rows as desktop) |
| 2 | Tap row → push **Claim workspace** full screen with back ← |
| 3 | Member 360 → full screen sheet over workspace |
| 4 | After approve/reject → back to queue with wrap-up |

**Sticky footer on mobile:** Approve full + Reject as primary buttons; partial in overflow menu.

---

## 11. Permissions matrix (UI elements)

| UI element | HEAD | DEPUTY delegated | DEPUTY not delegated | SECRETARY |
|------------|------|------------------|----------------------|-----------|
| See Decisions nav | ✓ | ✓ | ✓ | — (coordination office) |
| See queue | ✓ | ✓ | ✓ | read-only in contributions pending tab |
| Highlights / timeline | ✓ | ✓ | ✓ | ✓ |
| Approve full / partial | ✓ | ✓ | hidden | hidden |
| Reject | ✓ | ✓ | hidden | hidden |
| Member 360 | ✓ | ✓ | ✓ | ✓ |
| Utility: payment instructions | ✓ | ✓ | ✓ | ✓ |
| Payment settings edit | ✓ | — | — | — |

**API enforcement:** All actions re-check `canApprove` server-side; UI hiding is not sufficient alone (Tier S3).

---

## 12. API mapping

### 12.1 Existing endpoints (use as-is)

| Purpose | Endpoint |
|---------|----------|
| Role / delegation | `GET /finance/contributions/family/context` |
| Dashboard KPIs | `GET /finance/contributions/family/dashboard` |
| Queue | `GET /finance/contributions/family/inbox?familyId&status=SUBMITTED` |
| Timeline | `GET /finance/contributions/:id/timeline` |
| Approve | `POST /finance/contributions/:id/family/approve` |
| Reject | `POST /finance/contributions/:id/family/reject` |
| Member progress | `GET /finance/contributions/family/member-progress` |
| Payment settings | `GET/PATCH /families/:id` (payment fields) |

### 12.2 Gaps for full spec (implement in Wave 2)

| Gap | Needed for | Proposed |
|-----|------------|----------|
| Inbox `createdAt` in UI type | Age column, oldest widget | Already in API response; expose in `ContributionClaim` mapper |
| `receiptUrl` on inbox item | Proof section | Add to `serializeInboxItem` |
| `typeName` / `campaignName` on inbox contract doc | Highlights | Already serialized; document in API contract |
| Ledger filter by `memberId` | Member 360 Claims tab | Add query param to `family/ledger` |
| Member attendance snippet | Member 360 Attendance tab | `GET /families/:id/members/:memberId/attendance-summary` or extend metrics |
| Head display name for escalation | Deputy view-only card | Include in `family/context` per family |
| `GET /finance/contributions/:id` for leadership | Full claim fetch on deep link | Allow family leadership scope (today may be member-only) |

### 12.3 Error handling

| API | UI |
|-----|-----|
| Approve 400 validation | Inline field errors (amount, reason) |
| Approve 403 | Toast + refresh context (delegation revoked) |
| Approve 404 | Remove row; “Claim no longer available” |
| Reject 400 | Inline on reason field |
| Timeline 404 | Banner in timeline section |
| Inbox 404 | Full page “Office not available” |

---

## 13. Acceptance criteria

### 13.1 Head happy path

1. Head with 3 pending claims lands on `/decisions` (or one click from Command).
2. Oldest claim auto-selected; highlights populated.
3. Head clicks **Approve full** → claim confirmed → thank-you queued → next claim selected in < 2s perceived.
4. Timeline shows submit + approve events with actor name.
5. No modal overlay required for standard approve (inline panel only).

### 13.2 Partial and reject

1. Partial approve requires reason when amount ≠ claimed.
2. Reject requires min 3 chars; template prefills allowed.
3. Rejected claim disappears from queue; member receives workflow notification (existing backend).

### 13.3 Deputy

1. Delegated deputy sees “Acting approver” and can approve.
2. Non-delegated deputy sees queue but escalation card instead of action buttons.
3. No disabled ghost buttons visible anywhere.

### 13.4 Mobile

1. Queue usable on 375px width.
2. Claim detail readable without horizontal scroll except receipt link.
3. Back from detail returns to queue preserving scroll position.

### 13.5 Security

1. Head of Family A cannot open `?claimId=` for Family B record (403/404).
2. Secretary hitting approve API directly returns 403 regardless of UI.

---

## 14. Current code vs this spec

| Today | Target |
|-------|--------|
| `FamilyCommandHome` — cards + stat grid | 3-widget Command home (§4) |
| `FamilyLeadershipContributionsHub` pending tab — table + modal | Dedicated `/decisions` split console |
| `FamilyReviewModal` — bottom sheet | Inline action panel in workspace |
| Timeline only in ledger modal | Timeline standard on every pending claim |
| No Member 360 | Slide-over §7 |
| No utility bar | §8 |
| No wrap-up auto-next | §6.5 post-action flow |
| Deputy banner at top of hub | Delegation-aware action panel §9 |

**Primary files to add/change (implementation reference only):**

- New: `web/app/.../family-leadership/decisions/page.tsx`
- New: `web/components/choir/family-office/DecisionConsole.tsx`
- New: `web/components/choir/family-office/Member360Panel.tsx`
- Update: `web/lib/choir/family-office.ts` — nav + Decisions segment
- Update: `FamilyCommandHome.tsx` — 3-widget layout
- Deprecate: modal review flow in `FamilyLeadershipContributionsHub` for pending (keep ledger/history modals)

---

## 15. Copy deck (user-facing strings)

| Key | English |
|-----|---------|
| `decisions.title` | Pending decisions |
| `decisions.empty.title` | No pending claims |
| `decisions.empty.body` | All member payments are confirmed for now. |
| `decisions.approveFull` | Confirm full amount |
| `decisions.approvePartial` | Confirm different amount |
| `decisions.reject` | Reject claim |
| `decisions.escalation.title` | You cannot confirm payments |
| `decisions.escalation.body` | Pending claims are waiting for {headName}. |
| `decisions.actingBadge` | Acting approver |
| `decisions.wrapUp.next` | Next claim loaded |
| `decisions.wrapUp.done` | All caught up — no pending claims |

---

## 16. Next specs (same series)

After this console ships:

1. **Member obligation + giving** (SAP ESS + Fiori) — [`FAMILY_DEPARTMENT_SPEC.md`](FAMILY_DEPARTMENT_SPEC.md) §11  
2. **Secretary progress desk + meeting pack**  
3. **Deputy delegation states** (workflow diagram + notification rules)

---

## 17. Tier coverage checklist

| Tier ID | Feature | Covered in this spec |
|---------|---------|----------------------|
| S1 | Decision inbox split view | §5–6 |
| S4 | Claim timeline + audit | §6.4 |
| S5 | Conditional deputy approval | §9, §6.5, §11 |
| A6 | Member 360 | §6.2, §7 |
| A10 | Quick action templates | §6.5 |
| A9 | 3-widget persona home | §4 |
| B14 | Oldest pending aging KPI | §4.2, §5.2 |
