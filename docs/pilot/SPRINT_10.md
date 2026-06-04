# Sprint 10 — Choir Family Transformation & Contribution Governance

**Version:** 1.3 (reporting & personal visibility locked)  
**Status:** Locked specification — ready for Sprint 10.2.6+  
**Canonical path:** `docs/pilot/SPRINT_10.md`  
**v1.3 addendum:** [SPRINT_10_v1.3.md](./SPRINT_10_v1.3.md)

---

## Core Principle

**One approval gate only.** Family Head (or delegated Assistant Head) approves. Leadership supervises, audits, and adjusts through audited correction records — never re-approves.

```
Member submits → Family Head approves/rejects → CONFIRMED (final)
  → goals, lists, dashboards update (effectiveAmount)
Leadership may later adjust via ContributionAdjustment + AuditLog
```

---

## 1. Leadership Transition Rule (Global)

**Principle:** Leadership positions belong to people temporarily. Historical actions belong to the person who performed them permanently.

### On any leadership change

Applies to: Family Head, Assistant Head, Secretary, Family Coordinator, President, VP, Treasurer, custom leadership roles.

**Transfer immediately (current state):**

- Permissions (rebuilt from current assignments on each request)
- Dashboards
- Pending tasks / approval queues
- Current responsibilities

**Never transfer (historical integrity):**

- Audit logs
- Contribution approvals (`familyApprovedByMemberId`, `confirmedAmount`)
- Adjustments (`adjustedByMemberId`)
- Attendance actions
- Governance decisions
- Any historical record actor fields

### Example

```
Contribution approved by John — 2027-04-10
John replaced by Peter as Head

Display:
  Approved by: John
  Current Head: Peter

History unchanged.
```

**Implementation:** `PermissionsResolver` + `OperationalScopeService` derive live authority from current roles. Historical FKs on records remain immutable.

---

## 2. Domain Model

```
Choir
 └─ Family/Team (Family)
      HEAD | ASSISTANT_HEAD | SECRETARY | MEMBER
      delegationEnabled (gates assistant approval)
 └─ Family Coordinator (CHOIR_FAMILY_COORDINATOR)
 └─ ContributionTypeCatalog (configurable; soft lifecycle)
      └─ ContributionCampaign (DRAFT | ACTIVE | COMPLETED | ARCHIVED)
 └─ ContributionRecord
      familyId (snapshot at submission — see Family Transfer Rule)
      claimedAmount | confirmedAmount (immutable)
      effectiveAmount (computed)
 └─ ContributionAdjustment (adjustmentAmount + reason)
 └─ FamilyLeadershipHistory
```

**Member ID:** `memberNumber` only.  
**Phone:** Required for all members.

---

## 3. Approval vs Adjustment

### Approval

| | |
|---|---|
| **Purpose** | Verify claim vs actual received funds |
| **Actors** | Head; Assistant Head if `delegationEnabled = true` |
| **Can** | Confirm amount, reject, record discrepancy reason |
| **Cannot** | Edit `claimedAmount`, remove history |

If `delegationEnabled = false`, Assistant Head is **view-only** for approvals.

### Adjustment

| | |
|---|---|
| **Purpose** | Post-approval corrections |
| **Actors** | President, VP, Treasurer, Coordinator, Head (family scope), custom `choir.contribution.adjust` |
| **Requires** | `adjustmentAmount`, non-empty `reason`, **`category`** (enum), actor, timestamp |
| **Cannot** | Overwrite `claimedAmount` or `confirmedAmount` |

**Adjustment categories:** `CORRECTION`, `TRANSFER`, `REVERSAL`, `MISCLASSIFICATION`, `OTHER`.

**Adjustment audit (`CONTRIBUTION_ADJUST`):** `adjustmentAmount`, `category`, `reason`, `actorId`, `actorRole`, `timestamp`; optional `referenceContributionId`; context fields `effectiveAmountBefore` / `effectiveAmountAfter`. See [SPRINT_10_2.md](./SPRINT_10_2.md) § 10.2.7.

No silent adjustments. No empty reasons. No uncategorized adjustments.

**Data ownership:** See [SPRINT_10_2.md](./SPRINT_10_2.md) § Sprint 10.2.0 — family approval is Head/Assistant only; executives and Treasurer adjust but do not approve unless also family leaders.

---

## 4. Amount Model

```
effectiveAmount = confirmedAmount + Σ(adjustmentAmount)   // computed, never stored
```

| Case | Claimed | Confirmed | Adjustments | Effective |
|------|---------|-----------|-------------|-----------|
| 1 | 10,000 | 10,000 | none | 10,000 |
| 2 | 10,000 | 7,000 | +3,000 | 10,000 |
| 3 | 20,000 | 20,000 | -2,000 | 18,000 |

**Ledger:** `FinanceTransaction.amount = confirmedAmount` at approval. Adjustments append; ledger rows are not rewritten.

**Dashboard rule:**

| Metric class | Source |
|--------------|--------|
| Pending workflow | `claimedAmount` |
| Official financial (totals, rankings, goals, campaigns, charts) | `effectiveAmount` |

---

## 5. Contribution Type Lifecycle

**Allowed:** create, rename, deactivate (`active = false`), reactivate.

**Delete:** only when zero `ContributionRecord` references exist.

Otherwise deactivate — preserves reports and analytics.

---

## 6. Campaign Lifecycle

**Status enum:** `DRAFT` | `ACTIVE` | `COMPLETED` | `ARCHIVED`

| Status | Behavior |
|--------|----------|
| **DRAFT** | Leaders only; not selectable on member submit |
| **ACTIVE** | Available during contribution submission |
| **COMPLETED** | No new submissions; historical reporting available |
| **ARCHIVED** | Hidden from operational UI; reports and audits only |

Goal progress uses `effectiveAmount` from confirmed + adjusted records only.

---

## 7. Family Transfer Rule

When member moves Family A → Family B:

- **Historical** contributions keep `familyId = Family A` (snapshot at submission)
- **Future** contributions use `familyId = Family B`

Family rankings and period reports reflect reality at time of contribution.

**Member transfer:** enforce single active family via `FamilyMember.memberId` unique constraint.

---

## 8. Receipt Policy

- Receipts are **optional**
- Supported: image, PDF
- **Never mandatory** for approval — family-head confirmation is sufficient
- Sprint 10.6 implements upload/storage; approval flow must not block on receipt

---

## 9. Personal Visibility (v1.3)

Every member with a choir `Member` profile retains **own** contribution visibility regardless of officer role. Leadership expands scope (family / choir); it never removes personal access.

See [SPRINT_10_v1.3.md](./SPRINT_10_v1.3.md) §1 for the full matrix.

---

## 10. Ranking Visibility Policy

**Regular members must NOT see:**

- Top contributors
- Family rankings
- Contribution intelligence
- Goal comparison between families

**Regular members may see only:**

- My contributions
- My progress
- My contribution history
- My campaign participation (own scope)

Leadership sees rankings per RBAC scope. Enforced on web, mobile, API, search, dashboards, reports.

---

## 10. Notification Policy

### Member

| Event | Message (concept) |
|-------|-------------------|
| Submit | Contribution submitted. Awaiting family confirmation. |
| Approved | Contribution confirmed. Confirmed amount: X |
| Rejected | Contribution rejected. Reason: … |

### Head / delegated Assistant

| Event | Message |
|-------|---------|
| New submission | New contribution awaiting review. |

### Secretary

No approval notifications (view-only).

### Coordinator / President / VP / Treasurer

No per-contribution spam. Monitoring via dashboards and reports.

Thank-you / SMS uses required phone on **CONFIRMED** only.

---

## 11. Contribution Lists

One list per catalog type. Updates on approve, adjust, (future) reverse.

Type/family corrections → audit actions `CONTRIBUTION_TYPE_CHANGE`, `CONTRIBUTION_FAMILY_CHANGE`.

---

## 12. RBAC Matrix

| Role | Submit | Approve | Adjust | View |
|------|--------|---------|--------|------|
| Member | Own | — | — | Own only |
| Secretary | — | — | — | Family |
| Assistant Head | — | If delegated | — | Family |
| Head | — | Family | Family | Family |
| Coordinator | — | — | All | All |
| Treasurer / VP / President | — | — | All | All |
| CHURCH_ADMIN | — | — | — | — (unless union role) |

**Permission union:** Admin + ministry role = both sets.

---

## 13. Hidden Features Rule (Extended)

No permission means the feature **does not exist**:

- No navigation item
- No widget
- No route
- No menu
- No dashboard card
- No API payload fields
- No search results

Applies to: web, mobile, APIs, search, dashboards, reports.

---

## 14. Audit Actions

| Action | When |
|--------|------|
| `CONTRIBUTION_CREATE` / `CONTRIBUTION_SUBMIT` | Member flow |
| `CONTRIBUTION_FAMILY_APPROVE` / `CONTRIBUTION_FAMILY_REJECT` | Head approval |
| `CONTRIBUTION_ADJUST` | Amount adjustment (includes `category`) |
| `CONTRIBUTION_TYPE_CHANGE` | Type correction |
| `CONTRIBUTION_FAMILY_CHANGE` | Family assignment correction |
| `FAMILY_LEADERSHIP_*` | Role changes (via leadership history) |

All store: before, after, reason, user, timestamp where applicable.

---

## 15. Sprint Delivery Order

| Phase | Scope |
|-------|--------|
| **10.1** | Schema & RBAC ✅ |
| **10.2** | Contribution engine |
| **10.3** | Web UI |
| **10.4** | Mobile UI |
| **10.5** | Analytics & dashboards |
| **10.6** | Receipts & storage |

### 10.2 implementation order

**Implementation spec:** [SPRINT_10_2.md](./SPRINT_10_2.md) (controllers, services, DTOs, APIs, events, E2E plan).

**Official implementation IDs:** 10.2.0 → 10.2.8 (see [SPRINT_10_2.md](./SPRINT_10_2.md)).

| ID | Scope |
|----|--------|
| 10.2.0 | Data ownership audit + E2E Suite 0 |
| 10.2.1 | Member submission |
| 10.2.2 | Family approval inbox |
| 10.2.3 | Approval logic |
| 10.2.4 | Ledger posting |
| 10.2.5 | Goals & lists |
| 10.2.6 | Thank-you notifications |
| 10.2.7 | Adjustment engine (+ locked audit payload) |
| 10.2.8 | Leadership history completion |

### 10.2 E2E exit

Approval, discrepancy, delegation, secretary restriction, treasurer adjustment, hidden features, admin separation, family transfer snapshot, type deactivate-not-delete, campaign status gates.

---

## 16. Schema Reference

| Entity | Key fields |
|--------|------------|
| `Family` | `delegationEnabled` |
| `FamilyMemberRole` | HEAD, ASSISTANT_HEAD, SECRETARY, MEMBER |
| `ContributionTypeCatalog` | `active`, no hard delete if referenced |
| `ContributionCampaign` | `status`: DRAFT \| ACTIVE \| COMPLETED \| ARCHIVED |
| `ContributionRecord` | `claimedAmount`, `confirmedAmount`, `familyId` snapshot, `paymentAt` |
| `ContributionAdjustment` | `adjustmentAmount`, `reason`, `category`, `adjustedByMemberId` |
| `FamilyLeadershipHistory` | role tenure audit |

---

## Foundation Lock (post v1.2)

No further redesign required for:

- Membership model
- Family/team model
- Leadership hierarchy & transitions
- Contribution governance (approve vs adjust)
- Campaigns & goals
- Adjustments & effectiveAmount
- Audit trails
- Permissions & visibility
- Notifications policy
- Receipt optional policy

Subsequent sprints implement against this spec only.
