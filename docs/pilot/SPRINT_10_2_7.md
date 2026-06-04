# Sprint 10.2.7 — Governance Corrections (Frozen)

**Status:** ✅ Complete  
**Tests:** `backend/test/sprint-10.2.7-governance-corrections.e2e-spec.ts`

---

## APIs

```
POST /api/v1/finance/contributions/:id/change-family
POST /api/v1/finance/contributions/:id/change-type
POST /api/v1/finance/contributions/:id/change-campaign
GET  /api/v1/finance/contributions/:id/timeline
```

All corrections require `CONFIRMED` status and `choir.contribution.adjust` scope (same as amount adjust).

---

## Audits

| Action | Payload highlights |
|--------|-------------------|
| `CONTRIBUTION_FAMILY_CHANGE` | oldFamilyId, newFamilyId, reason, actorId, actorRole, timestamp |
| `CONTRIBUTION_TYPE_CHANGE` | oldCatalogId, newCatalogId, reason, … |
| `CONTRIBUTION_CAMPAIGN_CHANGE` | oldCampaignId, newCampaignId, reason, … |

**Never** mutates `claimedAmount`, `confirmedAmount`, or ledger rows.

---

## Timeline

Returns ordered events: submitted, approved, rejected, adjusted, family/type/campaign changed, thank-you sent, ledger posted.

Visibility: own record, family leadership, or `view.all`.

---

## Amount adjustments

Unchanged from 10.2.0: `POST .../adjust` with category + reason.
