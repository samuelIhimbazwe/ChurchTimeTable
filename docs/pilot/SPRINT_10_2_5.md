# Sprint 10.2.5 — Goals & Lists (Frozen)

**Status:** ✅ Complete (aligned with [SPRINT_10_v1.3.md](./SPRINT_10_v1.3.md))  
**Tests:** `backend/test/sprint-10.2.5-goals-lists.e2e-spec.ts` (11/11)

---

## Architecture rule (unchanged)

| Layer | Amount |
|-------|--------|
| Ledger (`FinanceTransaction`) | `confirmedAmount` at approval time — **never rewritten** |
| Reporting (totals, rankings, campaigns, lists) | `effectiveAmount` = `confirmedAmount + Σ(adjustmentAmount)` |
| Pending inbox / totals | `claimedAmount` for `SUBMITTED` only |

Only `CONFIRMED` records contribute to `effectiveAmount` aggregates. `SUBMITTED` and `REJECTED` are excluded from confirmed totals.

---

## Services

| Service | Role |
|---------|------|
| `ContributionEffectiveAmountService` | Single source for effective amount math |
| `ContributionTotalsService` | Family / type / campaign / choir aggregates |
| `ContributionListService` | Paginated list by contribution type catalog |
| `ContributionRankingsService` | Facade → `ContributionTotalsService.buildRankings()` |

---

## API

```
GET /api/v1/finance/contributions/totals
  ?familyId &contributionTypeCatalogId &contributionCampaignId &from &to &includeArchived

GET /api/v1/finance/contributions/rankings
  ?familyId &limit

GET /api/v1/finance/contributions/by-type/:catalogId
  ?familyId &contributionCampaignId &from &to &page &limit
```

### Totals response

- `pending` — `SUBMITTED` count + `claimedTotal`
- `confirmed` — `CONFIRMED` count + `effectiveTotal`
- `byType[]` — per catalog pending + effective
- `byCampaign[]` — goal, `confirmedEffective`, `progressPct` (ACTIVE + COMPLETED only; ARCHIVED only with `includeArchived=true`)
- `byFamily[]` — choir-wide scope only (`view.all`)

### Visibility

| Actor | Totals | Rankings | By-type list |
|-------|--------|----------|--------------|
| Member | Own scope only | ❌ 404 | Own records |
| Secretary | Family | ❌ 404 | Family leadership fields |
| Head / Assistant | Family | Family | Family leadership fields |
| Coordinator / Pres / VP / Treasurer (`view.all`) | Choir (+ `?scope=own` for personal) | Choir | Choir / filtered |
| CHURCH_ADMIN (account only) | ❌ 403 | ❌ 403 | ❌ |
| CHURCH_ADMIN + ministry union | Per union permissions | Per union | Per union |

---

## Campaign reporting

Included in progress widgets: `ACTIVE`, `COMPLETED`  
Excluded by default: `DRAFT`, `ARCHIVED`

## Ranking determinism (v1.3)

Tie-break: `familyCode ASC` (families), `memberNumber ASC` (members).

## Needs attention (v1.3)

Algorithmic thresholds in `contribution-reporting.constants.ts`:

- Pending backlog (`pendingBacklogCount`)
- Low campaign goal attainment (`lowGoalAttainmentPct`)
- No confirmed activity in period (`noActivityDays`)

Response includes `reasons[]` per family.

---

## Next

- **10.2.6** — Thank-you on `CONFIRMED`
- **10.2.7** — Adjustment finalization polish
- **10.2.8** — Leadership history
