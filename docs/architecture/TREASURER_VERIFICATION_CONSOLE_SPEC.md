# Treasurer — Verification Console (Screen-by-Screen Spec)

Wave **C1** primary surface for the **Treasurer office**. Implements Committee Tier **S2** (treasurer verification queue), partial **A9** (period close checklist), **A10** (posting macros), and **SoD** alignment with Family head approve + President view-only finance.

**Parent spec:** [`COMMITTEE_POSITIONS_SPEC.md`](COMMITTEE_POSITIONS_SPEC.md)  
**Money chain:** Member submit → [**Family head confirm**](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md) → **Treasurer verify** (this spec)  
**API contract:** [`API_CONTRACT_CONTRIBUTIONS_v1.md`](../pilot/API_CONTRACT_CONTRIBUTIONS_v1.md)

Last updated: June 2026

---

## 1. Purpose and north star

**North star:** “Reconcile money, close periods, and prove stewardship to leadership.”

The Verification Console is the treasurer’s **daily work surface** — not `ContributionTreasuryPanel` read-only lists and adjust modals scattered across stewardship pages. It combines:

| Reference | Pattern borrowed |
|-----------|------------------|
| **SAP FI-GL / Oracle Financials** | Verification queue → post to ledger → period close |
| **Blackbaud batch posting** | Confirm family-approved claims in batch with proof review |
| **Three-way match (AP)** | Claim + receipt + family approval alignment |
| **Salesforce (read-only exec)** | President sees summary; treasurer owns posting |
| **SAP Fiori** | Master–detail queue + mobile stack |
| **Infor OS Workspace** | Command home: queue count + campaign + close checklist |

---

## 2. Workflow model — current vs target

### 2.1 Target chain (enterprise SoD)

```
Member SUBMIT
    → Family head APPROVE (family scope, no ledger post)
    → Treasurer VERIFY (choir scope, ledger post + thank-you)
    → CONFIRMED
```

| Stage | Actor | Status (proposed) | Ledger |
|-------|-------|-------------------|--------|
| Submit | Member | `SUBMITTED` | None |
| Family approve | Head/deputy | `FAMILY_APPROVED` * | None |
| Treasury verify | Treasurer | `CONFIRMED` | Finance transaction created |
| Reject | Head or treasurer | `REJECTED` | None |

\* **New status** or equivalent: `SUBMITTED` + `familyApprovedAt != null` + `confirmedAt == null`.

### 2.2 Current implementation (gap)

Today `POST …/family/approve` in `ContributionGovernanceService.approveFamily`:

- Sets `status = CONFIRMED` immediately  
- Creates `financeTransaction` in same step  
- Sets `familyApprovedAt` and `confirmedAt` together  

**Treasurer console requires backend Wave C1b:** split family approve from treasury verify (see §12.2).

### 2.3 MVP on current APIs (interim)

Until workflow split ships, console **Queue A** uses existing surfaces:

| Queue | Source | Action |
|-------|--------|--------|
| **Sponsor gifts** | `GET /finance/contributions/sponsor/inbox` | Treasurer confirm/reject (no family step) |
| **Direct confirm** | `SUBMITTED` without family path | `POST /finance/contributions/:id/confirm` |
| **Discrepancy follow-up** | CONFIRMED with `discrepancyAmount` | Adjust + audit (existing) |
| **Stale family pending** | `SUBMITTED` with family | Read-only “waiting on family head” — not treasurer queue |

UI **must label** interim mode: “Full treasury queue activates after family/treasury split.”

---

## 3. Route and navigation

### 3.1 Canonical routes

| Screen | Route | Nav label |
|--------|-------|-----------|
| Command home | `/choir/{choirId}/budget` | Finance & budget |
| **Verification Console** | `/choir/{choirId}/budget/verify` | **Verify** |
| Stewardship / campaigns | `/choir/{choirId}/finance` | Campaigns & reports |
| Legacy stewardship embed | `/choir/{choirId}/stewardship` | Redirect to budget |

### 3.2 URL parameters

| Param | Purpose |
|-------|---------|
| `claimId` | Deep-link selected contribution |
| `queue` | `treasury` · `sponsor` · `discrepancy` |

### 3.3 Nav change

Under treasurer hub (`ChoirPositionHubShell roleKey=treasurer`):

```
Overview → Verify → Campaigns → Reports → …
```

Badge on **Verify** = `verificationQueueCount`.

### 3.4 Entry behavior

| Condition | Landing |
|-----------|---------|
| Treasurer opens `/budget` and queue > 0 | Redirect to `/budget/verify` |
| Notification “contributions need treasurer review” | `/budget/verify?claimId=` |
| President opens finance | View-only; no Verify nav item |

---

## 4. Information architecture

```
Treasurer office
├── Command home           (3 widgets — Infor)
├── Verification Console ★ (split queue — SAP FI)  ← THIS SPEC
│   ├── Queue pane (tabs: Treasury | Sponsor | Discrepancy)
│   ├── Claim workspace
│   │   ├── Highlights (three-way match)
│   │   ├── Family approval strip
│   │   ├── Proof & receipt
│   │   ├── Timeline
│   │   └── Post / reject panel
│   └── Period close drawer (A9)
├── Campaign admin         (existing)
└── Reports / export       (Power BI pack — future)
```

---

## 5. Screen A — Command home (redesigned)

**Route:** `/budget`  
**Reference:** Infor OS + SAP FI close dashboard

### 5.1 Three widgets

| Widget | Content | CTA |
|--------|---------|-----|
| **W1 Verification queue** | Count + oldest age | Open verify → |
| **W2 Campaign progress** | Active campaign % vs goal | Open campaigns |
| **W3 Period close** | Checklist completion (month) | Open close drawer |

### 5.2 Widget 1 — Verification queue

| Field | Source (target) | Interim |
|-------|-----------------|---------|
| Count | `GET /finance/contributions/treasury/inbox` | Sponsor inbox + confirmable SUBMITTED |
| Oldest age | inbox metadata | Same |
| Subtext | “Family-approved, awaiting post” | “Sponsor + direct confirm (interim)” |

### 5.3 Widget 3 — Period close checklist (A9)

| Check | Rule |
|-------|------|
| No claims in treasury queue | Block close |
| All families reconciled for month | Optional head “reconciled” flag (future) |
| Campaign variance reviewed | Manual tick |
| Export generated | Link to PDF |

**v1:** Static checklist with auto ticks from queue count = 0.

---

## 6. Screen B — Verification Console (split view)

**Route:** `/budget/verify`  
**Reference:** SAP FI posting queue + Fiori master–detail  
**Tier:** S2

### 6.1 Desktop layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Treasurer · Verify contributions                                        │
├───────────────────────┬──────────────────────────────────────────────────┤
│ QUEUE TABS            │ CLAIM WORKSPACE                                   │
│ [Treasury][Sponsor]   │ HIGHLIGHTS — three-way match                      │
│ [Discrepancy]         │ CNT-… · FAMILY_APPROVED · RWF 10,000             │
│ ─────────────────     │ Member · Family · Campaign · Channel              │
│ Oldest first (12)     ├──────────────────────────────────────────────────┤
│ ┌─────────────────┐   │ FAMILY APPROVAL STRIP                             │
│ │● Grace · 10,000 │   │ Confirmed by Head Joseph · 11 Mar · partial note  │
│ └─────────────────┘   ├──────────────────────────────────────────────────┤
│                       │ PROOF — receipt image / reference                   │
│                       ├──────────────────────────────────────────────────┤
│                       │ TIMELINE (submit → family → treasury)             │
│                       ├──────────────────────────────────────────────────┤
│                       │ POST PANEL — Verify & post · Reject to family      │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### 6.2 Queue tabs

| Tab | Contents | Primary action |
|-----|----------|----------------|
| **Treasury** | Family-approved, not posted (target) | Verify & post |
| **Sponsor** | Sponsor inbox SUBMITTED | Confirm (existing sponsor flow) |
| **Discrepancy** | CONFIRMED with amount mismatch | Open adjust workflow |

### 6.3 Queue row

| Field | Display |
|-------|---------|
| Reference | `referenceNumber` |
| Member | name + number |
| Amount | family-confirmed or claimed |
| Family | name |
| Age | since `familyApprovedAt` (target) or `createdAt` |
| Match flags | ✓ receipt · ✓ family · ⚠ partial |

---

## 7. Screen C — Claim workspace

**Reference:** SAP three-way match + Blackbaud gift batch

### 7.1 Highlights panel (three-way match)

| Leg | Fields | Match indicator |
|-----|--------|-----------------|
| **Claim** | reference, claimed amount, payment date, channel | — |
| **Proof** | receipt URL, member note | ✓ / missing |
| **Family approval** | confirmed amount, approver, date, discrepancy reason | ✓ / pending |

**Visual:** three columns with green/amber/red — treasurer sees mismatch before posting.

### 7.2 Family approval strip

| Field | Source |
|-------|--------|
| Confirmed amount | `confirmedAmount` |
| Approver | `familyApprovedByName` |
| Approved at | `familyApprovedAt` |
| Partial reason | `discrepancyReason` |
| Link | “Open in family ledger” (read-only deep link for treasurer) |

**President / coordinator:** read-only same strip; no post button.

### 7.3 Proof section

| Field | Behavior |
|-------|----------|
| Receipt | Inline thumbnail + open full |
| MoMo reference | Copy button |
| Payment instructions used | Family payment settings snapshot |

### 7.4 Timeline

**API:** `GET /finance/contributions/:id/timeline`

Expected events (target):

1. `submitted` — member  
2. `family_approved` — head/deputy  
3. `treasury_verified` — treasurer (new)  
4. `thank_you_sent`  

### 7.5 Post panel

#### Treasurer (`choir.finance.approve` or verify permission)

**Quick actions (A10):**

| Button | Behavior |
|--------|----------|
| **Verify & post** | Creates ledger txn; sets CONFIRMED; triggers thank-you |
| **Reject to family** | Returns to SUBMITTED or REJECTED with reason (target API) |
| **Hold for inquiry** | v2 — flag without reject |

**Verify & post validation:**

- Family approval present (target)  
- Receipt present if campaign requires proof  
- Amount > 0  
- No existing `financeTransactionId`  

**Wrap-up:** same as family console — next item auto-selected.

#### Family head opening treasurer URL

403 + “Treasurer verifies posted contributions.”

---

## 8. Sponsor queue (interim primary)

Uses existing `SponsorContributionInboxPanel` patterns inside console right pane.

| Field | Action |
|-------|--------|
| Sponsor gift SUBMITTED | `confirmContribution` or sponsor-specific approve |
| No family | Skip family strip; two-way match only |

---

## 9. Discrepancy queue

**Reference:** SAP adjustment workflow

Not a posting queue — items already CONFIRMED with `discrepancyAmount`.

| Action | API |
|--------|-----|
| Adjust effective amount | `POST /finance/contributions/:id/adjust` |
| View audit | timeline + adjustments list |

Treasurer **does not** re-open family approval; adjustments are signed deltas (existing `ContributionTreasuryPanel` copy explains this well — reuse in utility bar).

---

## 10. Period close drawer

**Reference:** Oracle month-end close

Slide-over from Command home widget 3 or console header.

| Step | Auto / manual |
|------|---------------|
| Treasury queue empty | Auto |
| Sponsor queue empty | Auto |
| Generate month export | Button → `GET /finance/export/pdf` |
| Mark month closed | Manual confirm + audit (new) |
| Notify president | Optional notification |

---

## 11. Segregation of duties (SoD)

| Rule | Enforcement |
|------|-------------|
| Family head confirms; treasurer posts | Split API (§2) |
| President has `choir.finance.view` only | No Verify nav |
| Same person head + treasurer | Warn on role assignment (GRC future) |
| Treasurer adjust after post | Allowed with reason; audit required |
| President cannot `confirmContribution` | Permission denied |

---

## 12. API mapping

### 12.1 Existing endpoints (interim)

| Purpose | Endpoint |
|---------|----------|
| List choir contributions | `GET /finance/contributions?status=SUBMITTED&familyOnly=` |
| Sponsor inbox | `GET /finance/contributions/sponsor/inbox?choirId=` |
| Confirm (legacy one-step) | `POST /finance/contributions/:id/confirm` |
| Reject | `POST /finance/contributions/:id/reject` |
| Adjust | `POST /finance/contributions/:id/adjust` |
| Timeline | `GET /finance/contributions/:id/timeline` |
| Stewardship stats | `GET /finance/stewardship/analytics` |
| Export | `GET /finance/export/pdf` |

### 12.2 Required for target workflow (Wave C1b)

| Gap | Proposed |
|-----|----------|
| Split family approve from treasury verify | Change `approveFamily` to set `FAMILY_APPROVED` (or `familyApprovedAt` only) **without** `financeTransactionId` |
| Treasury inbox | `GET /finance/contributions/treasury/inbox?choirId=` — `familyApprovedAt != null`, `status != CONFIRMED` |
| Treasury verify | `POST /finance/contributions/:id/treasury/verify` — creates txn, CONFIRMED, thank-you |
| Treasury reject | `POST /finance/contributions/:id/treasury/reject` — returns to family with reason |
| Dashboard | `GET /finance/contributions/treasury/dashboard?choirId=` — queue count, oldest, campaign, close checklist |
| Period close | `POST /finance/contributions/treasury/period-close` — month marker |
| Timeline event | `treasury_verified` actor in timeline service |

### 12.3 Error handling

| API | UI |
|-----|-----|
| Verify 409 (already posted) | Remove row; toast |
| Verify 400 (missing family approval) | Banner in workspace |
| Reject 403 | Toast |
| Adjust on non-CONFIRMED | Inline error |

---

## 13. Permissions matrix

| UI element | Treasurer | President | Family head |
|------------|-----------|-----------|-------------|
| Verify nav + badge | ✓ | — | — |
| Treasury queue | ✓ | — | — |
| Post / verify actions | ✓ | — | — |
| Sponsor queue confirm | ✓ | — | — |
| Discrepancy adjust | ✓ | — | — |
| Finance view (summary) | ✓ | ✓ | family scope only |
| Period close | ✓ | view checklist read-only | — |

---

## 14. Acceptance criteria

### 14.1 Target happy path (post-split)

1. Family head approves claim → appears in treasurer queue within same session.  
2. Treasurer opens three-way match → **Verify & post** → CONFIRMED + txn + thank-you.  
3. Next claim auto-selected; queue count decrements.  
4. Timeline shows submit → family → treasury events with actors.  

### 14.2 Interim happy path (pre-split)

1. Sponsor gift in sponsor tab → confirm from console.  
2. Discrepancy tab → adjust with reason.  
3. Treasury tab shows message when only family-pending SUBMITTED exist.  

### 14.3 Period close

1. Close blocked while sponsor queue > 0.  
2. Export generates PDF for selected month.  

### 14.4 SoD

1. Family head API cannot create finance transaction after split.  
2. President cannot hit treasury verify endpoint.  

---

## 15. Current code vs target

| Today | Target |
|-------|--------|
| `ContributionTreasuryPanel` lists + modal adjust | Split Verification Console |
| `StewardshipDashboard` embeds panel | Command home + `/budget/verify` |
| Family approve = CONFIRMED + txn | Split workflow §2 |
| No three-way match UI | Highlights panel §7.1 |
| No period close | Drawer §10 |
| Sponsor inbox separate component | Tab in same console |

**Primary files (implementation reference):**

- New: `web/app/.../budget/verify/page.tsx`  
- New: `web/components/choir/committee/TreasurerVerificationConsole.tsx`  
- New: `web/components/choir/committee/ThreeWayMatchPanel.tsx`  
- Update: `web/app/.../budget/page.tsx` — Command home  
- Backend: `contribution-governance.service.ts` — split approve/verify  
- Backend: `finance.controller.ts` — treasury inbox + verify routes  

---

## 16. Copy deck

| Key | English |
|-----|---------|
| `verify.title` | Verify contributions |
| `verify.empty` | No contributions awaiting treasury posting |
| `verify.post` | Verify & post to ledger |
| `verify.reject` | Return to family for correction |
| `verify.threeWay` | Claim · Proof · Family approval |
| `verify.interimNotice` | Family-approved queue will appear here after treasury workflow update |
| `verify.close.title` | Month-end close |
| `verify.close.blocked` | Complete the verification queue before closing |

---

## 17. Tier coverage

| Tier ID | Feature | Section |
|---------|---------|---------|
| S2 | Treasurer verification queue | §6–7 |
| A9 | Period close checklist | §5.3, §10 |
| A10 | Posting macros | §7.5 |
| SoD | Segregation head/treasurer/president | §2, §11 |

---

## 18. Related specs

- [`FAMILY_HEAD_DECISION_CONSOLE_SPEC.md`](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md) — upstream family approve  
- [`PRESIDENT_DECISION_CONSOLE_SPEC.md`](PRESIDENT_DECISION_CONSOLE_SPEC.md) — parallel people decisions  
- [`COMMITTEE_POSITIONS_SPEC.md`](COMMITTEE_POSITIONS_SPEC.md) — committee layer overview
