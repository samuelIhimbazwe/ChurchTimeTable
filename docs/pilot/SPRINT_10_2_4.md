# Sprint 10.2.4 — Ledger Posting (Frozen)

**Status:** ✅ Complete  
**Tests:** `backend/test/sprint-10.2.4-ledger.e2e-spec.ts` (6/6)

---

## Trigger

Ledger posting runs **only** when a contribution moves to `CONFIRMED` via:

```
POST /api/v1/finance/contributions/:id/family/approve
```

Rejections do **not** create ledger rows.

---

## Amount rule

| Field | Used for ledger? |
|-------|------------------|
| `confirmedAmount` | ✅ `FinanceTransaction.amount` |
| `claimedAmount` | ❌ member assertion only |
| `effectiveAmount` | ❌ post-confirm correction layer (10.2.5+ reporting) |

Discrepancy example: claimed `10000`, confirmed `7000` → ledger `7000` only.

---

## Transaction atomicity

Inside a single Prisma transaction:

1. Lock contribution (`SUBMITTED`, `financeTransactionId` null)
2. Create `FinanceTransaction` (INCOME, `APPROVED`, `transactionDate = familyApprovedAt`)
3. Update `ContributionRecord` → `CONFIRMED`, link `financeTransactionId`
4. Commit

No post-commit ledger creation (avoids orphan confirmations).

---

## Idempotency

If `financeTransactionId` is already set → **409 Conflict** (no second transaction).

---

## Audit

| Action | Entity | Metadata |
|--------|--------|----------|
| `FINANCE_TRANSACTION_CREATE` | `FinanceTransaction` | `contributionRecordId`, `financeTransactionId`, `amount`, `memberId`, `familyId` |
| `CONTRIBUTION_CONFIRMED` | `ContributionRecord` | includes `financeTransactionId` |

---

## Financial source of truth (freeze)

After 10.2.4:

- **Ledger history:** `FinanceTransaction` at `confirmedAmount` (approval-time snapshot)
- **Operational record:** `ContributionRecord` + adjustments → `effectiveAmount` for goals/lists (10.2.5+)

---

## Out of scope (10.2.5+)

- Type/family/campaign totals and rankings
- Thank-you delivery policy (10.2.6)
- Adjustment posting to ledger (adjustments affect `effectiveAmount` only in v1.2)
