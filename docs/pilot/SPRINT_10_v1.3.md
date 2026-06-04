# Sprint 10 — v1.3 Specification Lock (Pre-10.2.5 Reporting)

**Version:** 1.3  
**Status:** Locked — supersedes v1.2 reporting & visibility sections  
**Parent:** [SPRINT_10.md](./SPRINT_10.md) | **Implementation:** [SPRINT_10_2.md](./SPRINT_10_2.md)

---

## 1. Personal Visibility Rule (NEW)

**Principle:** Leadership permissions **expand** visibility; they **never replace** personal visibility.

Every choir member with a `Member` profile retains access to **their own** contribution records regardless of officer role (President, VP, Treasurer, Coordinator, Head, etc.).

### Visibility matrix

| Role | Own | Family | Choir |
|------|-----|--------|-------|
| Member | ✅ | ❌ | ❌ |
| Secretary | ✅ | ✅ | ❌ |
| Assistant Head | ✅ | ✅ | ❌ |
| Head | ✅ | ✅ | ❌ |
| Family Coordinator | ✅ | ✅ | ✅ |
| President | ✅ | ✅ | ✅ |
| Vice President | ✅ | ✅ | ✅ |
| Treasurer | ✅ | ✅ | ✅ |
| CHURCH_ADMIN | ❌* | ❌* | ❌* |

\* Unless combined with a ministry role through **permission union**.

### API implications

| Need | Route / query |
|------|----------------|
| Personal history | `GET /finance/contributions/mine`, `GET /finance/my-contributions` |
| Personal totals | `GET /finance/contributions/totals?scope=own` |
| Family totals | `GET /finance/contributions/totals?familyId=` (leadership) |
| Choir totals | `GET /finance/contributions/totals` (`choir.contribution.view.all`) |

---

## 2. Reporting Engine Rule (LOCKED)

All contribution **reporting** flows through a single service:

**`ContributionTotalsService`**

| Consumer | Must use totals engine |
|----------|----------------------|
| Rankings | ✅ via `buildRankings()` |
| Dashboards | ✅ |
| Goals | ✅ |
| Campaign progress | ✅ |
| Exports | ✅ |
| Reports | ✅ |
| Mobile summaries | ✅ |
| Web summaries | ✅ |

**No duplicate** effective-amount aggregation in controllers, dashboards, or ad-hoc queries.

**`ContributionEffectiveAmountService`** is the only effective-amount math helper.

---

## 3. Effective Amount Rule (LOCKED)

```
effectiveAmount = confirmedAmount + SUM(adjustmentAmount)
```

| Used for | Not used for |
|----------|----------------|
| Rankings | Ledger history |
| Goals | `FinanceTransaction` rows |
| Campaign progress | |
| Family / choir totals | |
| Analytics | |

Only `status = CONFIRMED` records count toward effective totals.

---

## 4. Ledger Rule (RECONFIRMED)

```
FinanceTransaction.amount = confirmedAmount   // at family approval time
```

Forever immutable. Adjustments **never** rewrite ledger history.

---

## 5. Ranking Determinism (NEW)

When `effectiveTotal` ties:

| Entity | Tie-break |
|--------|-----------|
| Families | `familyCode ASC` |
| Members | `memberNumber ASC` |

Prevents unstable ordering between requests.

---

## 6. Campaign Reporting Rule (LOCKED)

| Included | Excluded from progress / rankings / goals |
|----------|---------------------------------------------|
| `ACTIVE` | `DRAFT` |
| `COMPLETED` | `ARCHIVED` (unless `includeArchived=true` + leadership scope) |

---

## 7. Needs Attention Definition (LOCKED)

Algorithmic — not subjective. A family is listed when **one or more** thresholds are exceeded:

| Signal | Default threshold | Config |
|--------|-------------------|--------|
| Pending approvals backlog | `pendingCount >= 1` | `CONTRIBUTION_NEEDS_ATTENTION.pendingBacklogCount` |
| Low goal attainment | Campaign progress `< 25%` | `lowGoalAttainmentPct` |
| No contribution activity in period | No `CONFIRMED` in window | `noActivityDays` (default 90) |

Thresholds live in `contribution-reporting.constants.ts`.

---

## 8. Adjustment Governance (RECONFIRMED)

Required: `adjustmentAmount`, `category`, `reason`.

Categories: `CORRECTION`, `TRANSFER`, `REVERSAL`, `MISCLASSIFICATION`, `OTHER`.

Every adjustment → `CONTRIBUTION_ADJUST` audit with full payload.

---

## 9. Workflow freeze (unchanged)

```
Submit → Inbox → Approve/Reject → Ledger (confirmedAmount)
         ↓
Reporting (effectiveAmount) → totals → rankings → goals → campaigns
```

Sprint **10.2.5+** must not alter approval or ledger semantics validated in 10.2.3–10.2.4.

---

## 10. Sprint status (post-lock)

| Sprint | Status |
|--------|--------|
| 10.1 Foundation & RBAC | ✅ |
| 10.2.0 Ownership | ✅ |
| 10.2.1 Submission | ✅ |
| 10.2.2 Inbox | ✅ |
| 10.2.3 Approval | ✅ |
| 10.2.4 Ledger | ✅ |
| 10.2.5 Goals & Lists | ✅ (v1.3 aligned) |
| 10.2.6 Thank-you | ✅ |
| 10.2.7 Governance corrections | ✅ |
| 10.2.8 Leadership governance | ✅ |

**Architecture readiness:** 10/10
