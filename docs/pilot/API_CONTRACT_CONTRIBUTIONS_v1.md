# API Contract — Choir Contributions v1

**Status:** Frozen for Sprint 10.3 Web/Mobile UI  
**Base path:** `/api/v1`  
**Envelope:** All successful JSON responses use `{ data, meta }` via `ResponseInterceptor`.  
**Auth:** Bearer JWT unless noted.  
**Hidden features:** Missing permission → **404** (not 403) for intelligence endpoints (rankings, choir-wide list). Forbidden action on known resource → **403**.

Do not change request/response shapes during UI work without updating this document and E2E suites.

---

## Member submission

### `POST /finance/contributions/submit`

**Permission:** `choir.contribution.submit`  
**Phone guard:** Required (operational members)

**Request body**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `contributionTypeCatalogId` | UUID | ✅ | Active CHOIR catalog type |
| `contributionCampaignId` | UUID | ❌ | Campaign `ACTIVE`, matches type |
| `claimedAmount` | number | ✅ | `> 0` |
| `paymentAt` | ISO datetime | ✅ | |
| `paymentChannel` | `MOMO` \| `BANK` \| `OTHER` | ✅ | |
| `currency` | string | ❌ | Default `RWF` |
| `receiptUrl` | string | ❌ | Max 2000 |
| `notes` | string | ❌ | Max 500 |

**Response `201` (`data`)**

| Field | Type |
|-------|------|
| `id` | UUID |
| `referenceNumber` | string |
| `status` | `SUBMITTED` |
| `memberId` | UUID |
| `memberNumber` | string |
| `familyId` | UUID |
| `contributionTypeCatalogId` | UUID |
| `contributionCampaignId` | UUID \| null |
| `claimedAmount` | number |
| `confirmedAmount` | null |
| `currency` | string |
| `paymentAt` | datetime |
| `paymentChannel` | enum |
| `receiptUrl` | string \| null |
| `createdAt` | datetime |

**Errors:** `400` (no family, invalid catalog/campaign), `403` (permission), `404` (unknown ids)

---

## Family approval

### `GET /finance/contributions/family/context`

**Access:** Family `HEAD`, `ASSISTANT_HEAD`, or `SECRETARY`; not available to plain members without leadership role.

**Response `200` (`data`)**

```json
{
  "families": [
    {
      "familyId": "uuid",
      "familyCode": "FAM-001",
      "familyName": "string",
      "role": "HEAD | ASSISTANT_HEAD | SECRETARY",
      "delegationEnabled": false,
      "canApprove": true,
      "canViewInbox": true,
      "isViewOnly": false
    }
  ],
  "requiresFamilyPicker": false,
  "canViewAllFamilies": false
}
```

| Field | Meaning |
|-------|---------|
| `canApprove` | `HEAD`, or `ASSISTANT_HEAD` when `delegationEnabled` |
| `isViewOnly` | `SECRETARY`, or `ASSISTANT_HEAD` without delegation |
| `requiresFamilyPicker` | `true` when actor leads multiple families or has `view.all` |

**Errors:** `404` when no leadership membership (hidden feature pattern for unauthorized actors)

### `GET /finance/contributions/family/inbox`

**Access:** Family `HEAD`, `ASSISTANT_HEAD`, or `SECRETARY`; coordinators/executives with `choir.contribution.view.all` + `familyId`

**Query:** `familyId?`, `status?` (default `SUBMITTED`), `limit?` (default 30, max 100)

**Response `200` (`data`)**

```json
{
  "familyId": "uuid",
  "pendingCount": 2,
  "items": [
    {
      "id": "uuid",
      "referenceNumber": "CNT-…",
      "status": "SUBMITTED",
      "claimedAmount": 10000,
      "memberId": "uuid",
      "memberName": "string",
      "memberNumber": "string",
      "createdAt": "ISO-8601"
    }
  ]
}
```

### `POST /finance/contributions/:id/family/approve`

**Access:** `HEAD`, or `ASSISTANT_HEAD` when `family.delegationEnabled = true`

**Request body**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `confirmedAmount` | number | ✅ | `> 0` |
| `discrepancyReason` | string | Conditional | Required if `confirmedAmount !== claimedAmount` (min 3 chars) |

**Response `201` (`data`)** — workflow record:

| Field | Type |
|-------|------|
| `id`, `referenceNumber`, `status` (`CONFIRMED`) | |
| `memberId`, `memberNumber`, `familyId` | |
| `financeTransactionId` | UUID |
| `claimedAmount`, `confirmedAmount` | number |
| `discrepancyAmount`, `discrepancyReason` | number \| null, string \| null |
| `familyApprovedAt` | datetime |
| `thankYouDeliveryStatus`, `thankYouSentAt` | enum \| null, datetime \| null |
| `paymentAt`, `paymentChannel` | |
| `createdAt`, `updatedAt` | |

**Side effects:** Ledger row `FinanceTransaction.amount = confirmedAmount`; automatic thank-you SMS when phone present.

### `POST /finance/contributions/:id/family/reject`

**Request body**

| Field | Type | Required |
|-------|------|----------|
| `rejectionReason` | string | ✅ (min 3) |

**Response:** Same workflow shape as approve; `status = REJECTED`, `rejectionReason` set.

---

## Post-approval adjustment

### `POST /finance/contributions/:id/adjust`

**Access:** `CONFIRMED` only. Head (own family) or `choir.contribution.adjust` + view scope (executive/treasurer/coordinator).

**Request body**

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `adjustmentAmount` | number | ✅ | Non-zero signed delta |
| `category` | enum | ✅ | `CORRECTION`, `TRANSFER`, `REVERSAL`, `MISCLASSIFICATION`, `OTHER` |
| `reason` | string | ✅ | Min 3 chars |
| `referenceContributionId` | UUID | ❌ | Paired transfer/reversal |

**Response `201` (`data`)**

| Field | Type |
|-------|------|
| `contributionId` | UUID |
| `adjustmentId` | UUID |
| `adjustmentAmount` | number |
| `category` | enum |
| `confirmedAmount` | number (unchanged) |
| `effectiveAmount` | number |

**Audit:** `CONTRIBUTION_ADJUST` with `adjustmentAmount`, `category`, `reason`, `actorId`, `actorRole`, `timestamp`, `effectiveAmountBefore` / `After`.

**Immutable:** `claimedAmount`, `confirmedAmount`, ledger `FinanceTransaction.amount`.

---

## Governance corrections (10.2.7)

All require `CONFIRMED` + same adjust scope. Do not mutate ledger or confirmed/claimed amounts.

### `POST /finance/contributions/:id/change-family`

| Field | Type | Required |
|-------|------|----------|
| `newFamilyId` | UUID | ✅ |
| `reason` | string | ✅ (min 3) |

**Audit:** `CONTRIBUTION_FAMILY_CHANGE` — `oldFamilyId`, `newFamilyId`, `reason`, `actorId`, `timestamp`

### `POST /finance/contributions/:id/change-type`

| Field | Type | Required |
|-------|------|----------|
| `contributionTypeCatalogId` | UUID | ✅ |
| `reason` | string | ✅ (min 3) |

**Audit:** `CONTRIBUTION_TYPE_CHANGE`

### `POST /finance/contributions/:id/change-campaign`

| Field | Type | Required |
|-------|------|----------|
| `contributionCampaignId` | UUID \| null | ❌ (null clears campaign) |
| `reason` | string | ✅ (min 3) |

**Rules:** Target campaign must be `ACTIVE` or `COMPLETED` when set.

**Audit:** `CONTRIBUTION_CAMPAIGN_CHANGE`

**Correction response (`data`)** for all three:

| Field | Type |
|-------|------|
| `contributionId` | UUID |
| `status` | `CONFIRMED` |
| `familyId` | UUID |
| `contributionTypeCatalogId` | UUID |
| `contributionCampaignId` | UUID \| null |
| `confirmedAmount` | number |
| `effectiveAmount` | number |

---

## Contribution timeline

### `GET /finance/contributions/:id/timeline`

**Access:** Own member, family leadership for record's family, or `choir.contribution.view.all`. Church-admin account-only → hidden.

**Response `200` (`data`)**

```json
{
  "contributionId": "uuid",
  "referenceNumber": "CNT-…",
  "status": "CONFIRMED",
  "events": [
    {
      "type": "submitted",
      "timestamp": "ISO-8601",
      "actorId": "uuid | null",
      "actorRole": "string | null",
      "summary": "Contribution submitted",
      "metadata": {}
    }
  ]
}
```

**Event types (chronological):** `submitted`, `approved`, `rejected`, `adjusted`, `family_changed`, `type_changed`, `campaign_changed`, `thank_you_sent`, `ledger_posted`

Built from audit log + record fallbacks when audit rows are missing.

---

## Totals

### `GET /finance/contributions/totals`

**Query:** `scope?` (`own` \| `family` \| `choir`), `familyId?`, `contributionTypeCatalogId?`, `contributionCampaignId?`, `from?`, `to?`, `includeArchived?`

**Response `200` (`data`)**

| Field | Type | Description |
|-------|------|-------------|
| `scope` | `own` \| `family` \| `choir` | Resolved visibility |
| `familyId` | UUID \| null | Set when `scope = family` |
| `pending` | `{ count, claimedTotal }` | `SUBMITTED` — sums `claimedAmount` |
| `confirmed` | `{ count, effectiveTotal }` | `CONFIRMED` — sums `effectiveAmount` |
| `byType` | array | `{ catalogId, code, name, pendingClaimed, confirmedEffective }` |
| `byCampaign` | array | `{ campaignId, name, status, goalAmount, confirmedEffective, progressPct }` |
| `byFamily` | array | Choir scope only: `{ familyId, confirmedEffective }` |

**v1.3:** Executives with choir-wide access still see **own** totals when `scope=own`.

---

## Recent adjustments (executive review)

### `GET /finance/contributions/adjustments/recent`

**Access:** `choir.contribution.view.all` (church-admin account-only → hidden)

**Query:** `limit?` (default 20, max 50)

**Response `200` (`data`)**

```json
{
  "items": [
    {
      "adjustmentId": "uuid",
      "contributionId": "uuid",
      "referenceNumber": "CNT-…",
      "adjustmentAmount": -50000,
      "category": "CORRECTION",
      "reason": "string",
      "createdAt": "ISO-8601",
      "memberId": "uuid",
      "memberNumber": "string",
      "memberName": "string",
      "familyId": "uuid | null",
      "familyCode": "string | null",
      "familyName": "string | null",
      "campaignName": "string | null"
    }
  ]
}
```

---

## Rankings & needs attention

### `GET /finance/contributions/rankings`

**Query:** `familyId?`, `limit?` (default 10, max 50), `from?`, `to?`

**Hidden:** Member, secretary → **404**

**Response `200` (`data`)**

```json
{
  "scope": "choir | family",
  "familyId": "uuid | null",
  "topFamilies": [
    {
      "familyId": "uuid",
      "familyCode": "FAM000001",
      "familyName": "string",
      "effectiveTotal": 25000,
      "goalProgressPct": 72.4
    }
  ],
  "topContributors": [
    {
      "memberId": "uuid",
      "memberNumber": "string",
      "memberName": "string",
      "effectiveTotal": 25000,
      "familyId": "uuid | null",
      "familyCode": "string | null",
      "familyName": "string | null"
    }
  ],
  "needsAttention": [
    {
      "familyId": "uuid",
      "familyCode": "string | null",
      "familyName": "string",
      "effectiveTotal": 0,
      "pendingCount": 3,
      "lowestCampaignProgressPct": 12.5,
      "flagged": true,
      "reasons": ["pending_backlog", "low_goal", "no_recent_activity"]
    }
  ]
}
```

Rankings use **effectiveAmount** on `CONFIRMED` records only.

---

## List by type

### `GET /finance/contributions/by-type/:catalogId`

**Query:** Same filters as totals + `page?`, `limit?`

**Response `200` (`data`):** Paginated `items` with `id`, `referenceNumber`, `status`, amounts (`claimedAmount`, `confirmedAmount`, `effectiveAmount` when confirmed), `memberId`, `familyId`, `paymentAt`, `createdAt`; leadership view adds `memberNumber`, `memberName`.

---

## Leadership history (families)

### `GET /families/:id/leadership-history`

**Access:** `family.view` / `family.manage` scope

**Response `200` (`data`)**

```json
{
  "familyId": "uuid",
  "items": [
    {
      "id": "uuid",
      "memberId": "uuid",
      "memberNumber": "string",
      "memberName": "string",
      "role": "HEAD | ASSISTANT_HEAD | SECRETARY",
      "startedAt": "ISO-8601",
      "endedAt": "ISO-8601 | null",
      "assignedByUserId": "uuid | null"
    }
  ]
}
```

### `PATCH /families/:id/members/:memberId`

**Body:** `{ role: FamilyMemberRole }` — closes/opens `FamilyLeadershipHistory` for leadership roles.

**Audits:** `FAMILY_LEADERSHIP_ASSIGNED`, `FAMILY_LEADERSHIP_ENDED`, `FAMILY_MEMBER_ROLE_CHANGE`

### `PATCH /families/:id` — `delegationEnabled`

**Audit:** `FAMILY_DELEGATION_TOGGLE`

---

## Personal history (member) — Sprint 10.3.1

| Endpoint | Purpose |
|----------|---------|
| `GET /finance/contributions/member` | Paginated choir records (rich shape) + `summary` |
| `GET /finance/contributions/:id` | Single own record (404 if not owner) |
| `GET /finance/contributions/submit-options` | Active catalog types + ACTIVE campaigns |
| `GET /finance/contributions/totals?scope=own` | Personal progress totals |
| `GET /finance/contributions/mine` | Legacy combined payload (dues + records) |
| `GET /finance/my-contributions` | Alias of `/mine` |
| `GET /finance/my-contributions/summary` | Own aggregates |

**Member list query:** `page`, `limit`, `status`, `contributionTypeCatalogId`, `contributionCampaignId`

**Member record fields:** `claimedAmount`, `confirmedAmount`, `effectiveAmount`, `typeName`, `campaignName`, `familyName`, `adjustments[]`, etc.

Church-admin account-only denied. `canViewOwn` requires member profile (v1.3 — all choir members).

---

## Legacy (do not use in 10.3 UI)

| Route | Behavior |
|-------|----------|
| `POST /finance/contributions/:id/confirm` | **410 Gone** |
| `GET /finance/contributions/queue` | **410 Gone** — use `/family/inbox` |

---

## Effective amount (reporting rule)

```
effectiveAmount = confirmedAmount + Σ(adjustmentAmount)
```

Only `CONFIRMED` records count toward official totals, rankings, and campaign progress.

---

## Sprint 10.3 UI mapping

| Phase | Screens | Primary APIs |
|-------|---------|--------------|
| 10.3.1 Contribution Center | My list, detail, timeline, submit | `mine`, `timeline`, `submit` |
| 10.3.2 Family workspace | Inbox, approve/reject, family totals/rankings | `family/inbox`, `family/approve`, `family/reject`, `totals`, `rankings` |
| 10.3.3 Executive stewardship | Choir totals, campaigns, analytics, needs attention | `totals`, `rankings`, `by-type`, `stewardship/analytics` |
| 10.3.4 Administration | Types/campaigns CRUD, leadership history | Catalog/campaign admin routes, `leadership-history` |

---

## Regression command

```powershell
cd backend
npm run test:e2e -- --testPathPatterns="sprint-10"
```

Covers: ownership, submission, inbox, approval, ledger, reporting, thank-you, corrections, leadership governance, and 10.1 exit criteria.
