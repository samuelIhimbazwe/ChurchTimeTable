# Sprint 10.2.3 — Approval Logic (Frozen)

**Status:** ✅ Complete  
**Tests:** `backend/test/sprint-10.2.3-approval.e2e-spec.ts` (17/17)

---

## Frozen rules (do not change without spec amendment)

### Approval actors

| Actor | Approve / reject |
|-------|------------------|
| `HEAD` | ✅ |
| `ASSISTANT_HEAD` + `delegationEnabled=true` | ✅ |
| `ASSISTANT_HEAD` + `delegationEnabled=false` | ❌ (inbox view still ✅) |
| Secretary, Treasurer, President, VP, Coordinator, Member, CHURCH_ADMIN | ❌ unless also qualifying family role |

### Preconditions

- Only `SUBMITTED` → `CONFIRMED` or `REJECTED`
- `CONFIRMED` / `REJECTED` re-processing → **409 Conflict**

### Discrepancy

If `confirmedAmount !== claimedAmount` → `discrepancyReason` required (min 3 chars), else **400**.

### Immutable on approve

Must not change: `claimedAmount`, `memberId`, `familyId`, `paymentAt`, `contributionTypeCatalogId`, `contributionCampaignId`.

May set: `confirmedAmount`, `discrepancyAmount`, `discrepancyReason`, `familyApprovedByMemberId`, `familyApprovedAt`, `status`, `confirmedAt`, `confirmedById`.

### Audit actions

| Action | Payload highlights |
|--------|-------------------|
| `CONTRIBUTION_CONFIRMED` | claimedAmount, confirmedAmount, discrepancyAmount, discrepancyReason, approverId, approverRole, familyId, memberId |
| `CONTRIBUTION_REJECTED` | rejectionReason, actorId, actorRole, familyId, memberId |

### Notifications (10.2.3)

- Member notified on confirm / reject
- No executive per-contribution spam

### Ledger (10.2.4 — see [SPRINT_10_2_4.md](./SPRINT_10_2_4.md))

- Implemented in `ContributionGovernanceService.approveFamily()` inside the approval transaction

### Out of scope (10.2.5+)

- Thank-you SMS (10.2.6)
- Goal/total refresh (10.2.5)

---

## API

```
POST /api/v1/finance/contributions/:id/family/approve
{ "confirmedAmount": 10000, "discrepancyReason": "..." }

POST /api/v1/finance/contributions/:id/family/reject
{ "rejectionReason": "..." }
```
