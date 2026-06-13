# Member Office — Obligations & Giving (Screen-by-Screen Spec)

Wave 2 primary surface for the **Member office** (choir singer ESS). Implements Tier **S2** (member obligation queue), **S4** (claim timeline + audit on member view), and **B15** (mobile stacked list–detail).

**Parent spec:** [`FAMILY_DEPARTMENT_SPEC.md`](FAMILY_DEPARTMENT_SPEC.md)  
**Companion (head side):** [`FAMILY_HEAD_DECISION_CONSOLE_SPEC.md`](FAMILY_HEAD_DECISION_CONSOLE_SPEC.md)  
**API contract:** [`API_CONTRACT_CONTRIBUTIONS_v1.md`](../pilot/API_CONTRACT_CONTRIBUTIONS_v1.md)

Last updated: June 2026

---

## 1. Purpose and north star

**North star:** “Tell me what I owe; let me pay and prove it; show me status.”

The member office is **Employee Self-Service (ESS)** for choir family giving — not choir admin, not committee hubs. Daily work = **one obligation queue** + **list–detail giving**, not four tabs and modal overlays.

| Reference | Pattern borrowed |
|-----------|------------------|
| **SAP SuccessFactors ESS** | Personal task list: what I must do now |
| **SAP Fiori List–Detail** | Claims list + inline detail; mobile stack |
| **Infor OS Workspace** | My week home = max 3 widgets |
| **Power Automate (member side)** | Clear states: submit → waiting → confirmed / rejected → resubmit |

---

## 2. Route and navigation

### 2.1 Canonical routes

| Screen | Route | Nav label | Role |
|--------|-------|-----------|------|
| My week | `/choir/{choirId}/membership` | My week | Default home |
| **My obligations** | `/choir/{choirId}/membership/obligations` | **To do** | Primary when queue non-empty |
| My giving | `/choir/{choirId}/membership/giving` | My giving | List–detail + submit |
| My family | `/choir/{choirId}/membership/family` | My family | Read-only team |
| My attendance | `/choir/{choirId}/membership/attendance` | My attendance | Personal record |
| Music & prep | `/choir/{choirId}/membership/music` | Music & prep | Job aids |
| Announcements | `/choir/{choirId}/membership/announcements` | Announcements | List–detail comms |

### 2.2 URL parameters (My giving)

| Param | Purpose | Example |
|-------|---------|---------|
| `detailId` | Selected claim in list–detail | `?detailId=uuid` |
| `tab` | Legacy tab (demote over time) | `submit`, `history` |
| `status` | Filter claims list | `SUBMITTED`, `CONFIRMED`, `REJECTED` |

**Target v2:** Replace `?tab=` with path segments: `/giving/submit`, `/giving/claims`.

### 2.3 Office nav change

Insert **To do** after My week; badge = obligation count when > 0:

```
My week → To do → My giving → My family → …
```

### 2.4 Entry behavior

| Condition | Landing |
|-----------|---------|
| Member opens `/membership` with obligations > 0 | Stay on My week (3 widgets) — **or** optional redirect to `/obligations` (same as head: recommend redirect only if count ≥ 1 and highest priority is rejected) |
| Attention strip chip click | Deep link to obligation or giving detail |
| Rejected claim exists | My week widget 1 = red “Fix rejection”; links to giving detail with resubmit CTA |

---

## 3. Information architecture

```
Member office (ESS)
├── My week                 (3 widgets — Infor)
├── My obligations ★        (unified task queue — SAP ESS)
├── My giving               (list–detail — Fiori)
│   ├── Claims list pane
│   ├── Claim detail pane
│   └── Submit payment (inline or sub-route)
├── My family               (read-only directory)
└── Secondary: attendance, music, announcements
```

---

## 4. Obligation model (computed client-side v1)

No new backend table in v1. Build queue from existing APIs:

| Priority | Obligation type | Source | CTA |
|----------|-----------------|--------|-----|
| 1 | **Rejected claim** | `listMine` where status display = rejected | Open claim → resubmit |
| 2 | **Pending confirmation** | `listMine` where status = waiting (SUBMITTED) | Open claim → view status |
| 3 | **Pay / submit** | `totals.byCampaign` where progress < 100% and no pending claim for campaign | Submit payment |
| 4 | **Upcoming rehearsal/service** | `memberPortalApi.getHome` + schedule | My attendance |
| 5 | **Unread announcement** (optional v2) | announcements API | Open announcement |

Each obligation row:

| Field | Value |
|-------|-------|
| `id` | Stable key (`obligation-{type}-{entityId}`) |
| `title` | Human readable |
| `subtitle` | Amount, date, or reason |
| `priority` | 1–5 |
| `href` | Deep link |
| `tone` | danger / warning / info / neutral |

---

## 5. Screen A — My week (redesigned)

**Route:** `/membership`  
**Reference:** Infor OS Workspace  
**Tier:** A9 (partial)

### 5.1 Layout — exactly 3 widgets

```
┌─────────────────────────────────────────────────────────────┐
│  My week                                                     │
├─────────────────────────────────────────────────────────────┤
│  [W1 To do]          [W2 Giving status]    [W3 Next event]  │
└─────────────────────────────────────────────────────────────┘
```

Remove from v2 home: “Recent activity” card, stat sprawl, portal footer links on primary scroll (move to office nav footer).

### 5.2 Widget 1 — To do (primary)

| Field | Source | Display |
|-------|--------|---------|
| Count | obligation queue length | “2 things need your attention” |
| Top item | highest priority obligation | Title + subtitle one line |
| CTA | — | “Open to-do →” |

**Click:** `/membership/obligations`

**Empty:** “You’re all caught up” + green check.

### 5.3 Widget 2 — Giving status

| Field | Source | Display |
|-------|--------|---------|
| Campaign | `totals.byCampaign[0]` | Name |
| Progress | `progressPct`, confirmed / goal | Bar + `RWF` |
| Pay hint | `submitCtx.family.payment` | “Pay MoMo …” one line |

**Click:** `/membership/giving`

### 5.4 Widget 3 — Next event

| Field | Source | Display |
|-------|--------|---------|
| Title | next choir event this week | Single event |
| When | date + time | `formatDate` |

**Click:** `/membership/attendance`

**Empty:** “No choir events this week.”

### 5.5 Attention strip (office shell)

Keep `MemberAttentionStrip` in `MemberOfficeShell` hero — max 2 chips, same priority rules as obligation model. Chips must match widget 1 items (no conflicting copy).

---

## 6. Screen B — My obligations (task queue)

**Route:** `/membership/obligations`  
**Reference:** SAP ESS task inbox  
**Tier:** **S2**

### 6.1 Layout

Single homogeneous list — not cards.

```
┌─────────────────────────────────────────────────────────────┐
│  To do · 3 items                                             │
├─────────────────────────────────────────────────────────────┤
│  ● Fix rejected payment          Grace seed · RWF 10,000  → │
│  ○ Waiting for family head       Submitted 2 days ago     → │
│  ○ Complete March giving         RWF 5,000 remaining      → │
│  ○ Rehearsal Thursday            7:00 PM                  → │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Row fields

| Column | Content |
|--------|---------|
| Priority indicator | Dot: red (rejected), amber (pending/behind), blue (info) |
| Title | Obligation title |
| Subtitle | Context line |
| Chevron | Affordance |

**Row tap:** navigate to `href` — never opens modal on this screen.

### 6.3 Empty state

```
✓  You’re all caught up

No payments or follow-ups need your attention right now.
View giving history →
```

### 6.4 Loading / error

| State | UI |
|-------|-----|
| Loading | 4 skeleton rows |
| Partial API failure | Show available obligations + banner “Some items couldn’t load” |
| No family | Banner: “You’re not assigned to a family — contact your family head.” Submit disabled elsewhere |

---

## 7. Screen C — My giving (list–detail)

**Route:** `/membership/giving`  
**Reference:** SAP Fiori list–detail  
**Tier:** S4, B15

Replaces today’s `MemberContributionsHub` tab + modal pattern for claims browsing.

### 7.1 Desktop layout (≥ lg)

```
┌───────────────────────┬──────────────────────────────────────┐
│ CLAIMS LIST           │ CLAIM DETAIL                          │
│ Filter: All ▾         │ CNT-2026-00142 · Waiting              │
│ ─────────────────     │ ───────────────────────────────────── │
│ ● Grace seed 10,000   │ Amount · Date · Channel · Status      │
│   Waiting · 2 Mar     │ Timeline                              │
│ ○ Tithe 5,000         │ Rejection reason (if any)             │
│   Confirmed · 1 Feb   │ [Submit new payment] (contextual)     │
└───────────────────────┴──────────────────────────────────────┘
│ STICKY: Family payment instructions (MoMo / bank)              │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 List pane

**API:** `GET /finance/contributions/member` (paginated)

| Column | Field |
|--------|-------|
| Primary | `typeName` or `campaignName` |
| Secondary | `formatDate(paymentAt)` or `createdAt` |
| Amount | `claimedAmount` |
| Status badge | `resolveMemberDisplayStatus(claim)` |

**Filters (header):**

| Filter | Query param |
|--------|-------------|
| All | — |
| Waiting | `status=SUBMITTED` |
| Confirmed | `status=CONFIRMED` |
| Rejected | `status=REJECTED` |
| By type | `contributionTypeCatalogId` |

**Sort:** Newest first (default).

**Row click:** set `detailId` in URL; load detail pane.

**Primary action (list header):** button **Submit payment** → submit panel (§8).

### 7.3 Detail pane (not modal)

**API:** `GET /finance/contributions/:id` + `GET /finance/contributions/:id/timeline`

Same field set as today’s `ContributionDetailPanel` but **inline** in right pane:

| Section | Fields |
|---------|--------|
| Header | `referenceNumber`, status badge |
| Amounts | claimed, confirmed (if any), effective |
| Payment | date, channel, notes |
| Verification | `discrepancyReason`, `rejectionReason`, approver name/date |
| Timeline | chronological events (S4) |
| Thank-you | delivery status if confirmed |

**Contextual actions:**

| Status | Actions |
|--------|---------|
| REJECTED | **Submit again** — opens submit form prefilled (type, campaign, suggested amount) |
| SUBMITTED | None (read-only) + copy “Waiting for {familyName} head” |
| CONFIRMED | None |

**Do not show** approve/reject controls (member ESS).

### 7.4 Payment instructions strip

**Component:** existing `FamilyPaymentInstructionsCard`  
**Position:** Below split view or sticky footer on mobile  
**Source:** `GET /finance/contributions/submit-options` → `family.payment`

Always visible on giving screen — member should never hunt for MoMo number.

### 7.5 Mobile (< lg)

Fiori stacked:

1. List full width  
2. Tap row → full-screen detail with ← back  
3. Submit payment → full-screen form  

---

## 8. Screen D — Submit payment

**Route:** `/membership/giving?tab=submit` (v1) → `/membership/giving/submit` (v2)  
**Reference:** SAP ESS “create request”  
**Component:** existing `ContributeClaimForm`

### 8.1 Entry points

| From | Behavior |
|------|----------|
| Obligations “Complete giving” | Open submit with campaign pre-selected |
| Giving list header button | Open submit |
| Rejected detail “Submit again” | Prefill from rejected claim |
| My week widget 2 | Submit when behind |

### 8.2 Form fields (unchanged — API frozen)

| Field | Required |
|-------|----------|
| Contribution type | ✅ |
| Campaign | if active campaigns exist |
| Claimed amount | ✅ |
| Payment date | ✅ |
| Channel (MoMo/Bank/Other) | ✅ |
| Receipt URL | optional |
| Notes | optional |

### 8.3 Post-submit flow

1. Success toast: “Claim submitted — waiting for family confirmation”  
2. Navigate to giving detail for new claim (`detailId=newId`)  
3. Obligation queue updates: item becomes “Waiting for family head”  
4. Invalidate `my-contributions-list`, `member-contribution-totals`

### 8.4 Validation errors

| Error | UI |
|-------|-----|
| No family | Block form; link to contact family head |
| No phone (API guard) | Banner with profile link |
| 400 campaign/type | Inline field error |

---

## 9. Screen E — My family (read-only)

**Route:** `/membership/family`  
**Reference:** SAP org chart lite  
**No change in Wave 2** except copy audit:

| Show | Hide |
|------|------|
| Family name, head name, payment instructions link | Roster admin, structure editor |
| Member directory of **my family only** | Other families |

**CTA:** “Submit payment →” links to giving submit.

---

## 10. Permissions

| Action | Member | Family head viewing as member |
|--------|--------|------------------------------|
| View own claims | ✅ | ✅ (own claims only) |
| Submit claim | ✅ | ✅ |
| View family payment instructions | ✅ | ✅ |
| Approve claims | ❌ | ❌ in member office |
| View other members’ claims | ❌ | ❌ |

Dual-role users: member office and family office remain **separate sidebar entries** — never merged.

---

## 11. API mapping

### 11.1 Existing (use as-is)

| Purpose | Endpoint |
|---------|----------|
| Totals / goals | `GET /finance/contributions/totals?scope=own` |
| Claim list | `GET /finance/contributions/member` |
| Claim detail | `GET /finance/contributions/:id` |
| Timeline | `GET /finance/contributions/:id/timeline` |
| Submit | `POST /finance/contributions/submit` |
| Submit context | `GET /finance/contributions/submit-options` |
| Schedule | `GET /member-portal/home`, `GET /dashboard/member-summary` |

### 11.2 Gaps (optional Wave 2)

| Gap | Purpose | Priority |
|-----|---------|----------|
| `GET /member-portal/obligations?choirId=` | Server-computed queue | Nice-to-have; client compose OK for v1 |
| Leadership read on `GET /contributions/:id` | N/A for member spec | — |

---

## 12. Acceptance criteria

### 12.1 Obligation queue (S2)

1. Rejected claim always appears first in `/obligations` and attention strip.  
2. Member completes “fix rejection” in ≤ 3 taps from My week (week → obligations → detail → submit again).  
3. Empty queue shows positive empty state, not blank page.

### 12.2 List–detail giving

1. Member browses claims without modal on desktop.  
2. Timeline visible on every claim detail (S4).  
3. Payment instructions visible without leaving giving screen.  
4. Mobile back from detail preserves list scroll.

### 12.3 My week

1. Exactly 3 widgets; no duplicate “recent activity” list.  
2. Widget 1 count matches `/obligations` list length.

### 12.4 Integration with head console

1. Member submits → appears in head `/decisions` queue within one refresh cycle.  
2. Head rejects → member obligation queue shows rejection within one refresh cycle.  
3. Status strings consistent: “Waiting for family confirmation” (member) ↔ “Waiting” (head queue).

---

## 13. Current code vs target

| Today | Target |
|-------|--------|
| `MemberWeekHome` — cards + recent activity | 3-widget My week (§5) |
| `MemberAttentionStrip` — chips only | Align with obligation model |
| `MemberContributionsHub` — 4 tabs + detail modal | List–detail giving (§7) |
| No `/obligations` route | Dedicated task queue (§6) |
| Submit buried in tab | Prominent from queue + giving header |

**Primary files (implementation reference):**

- New: `web/app/.../membership/obligations/page.tsx`
- New: `web/components/choir/membership/MemberObligationQueue.tsx`
- New: `web/components/choir/membership/MemberGivingConsole.tsx` (list–detail)
- Update: `MemberWeekHome.tsx`, `membership-office.ts` nav
- Refactor: `MemberContributionsHub.tsx` → split or wrap new console

---

## 14. Copy deck

| Key | English |
|-----|---------|
| `obligations.title` | To do |
| `obligations.empty` | You’re all caught up |
| `obligations.rejected` | Fix rejected payment |
| `obligations.pending` | Waiting for family confirmation |
| `obligations.pay` | Complete {campaignName} giving |
| `giving.submit` | Submit payment |
| `giving.waiting` | Waiting for family confirmation |
| `giving.resubmit` | Submit again |

---

## 15. Tier coverage

| Tier | Feature | Section |
|------|---------|---------|
| S2 | Member obligation queue | §6 |
| S4 | Claim timeline on detail | §7.3 |
| A9 | 3-widget My week | §5 |
| B15 | Mobile list–detail | §7.5 |

---

## 16. Dual-role note

Users who are both singer and family head see:

- **My membership** → this spec  
- **Family leadership** → Decision console spec  

Submitting a claim as member uses member office; confirming it uses family office. Never auto-switch context.
