# Ministry Finance (MF-5)

Separate **ministry-scoped** finance from church-wide stewardship and the **choir contribution system**.

## Scopes

| Scope | System |
|-------|--------|
| Church finance | Legacy `/finance/transactions`, `/finance/budgets` (`MinistryScope` enum) |
| Choir contributions | `/finance/contributions/*` — **unchanged, authoritative** |
| Ministry finance (MF-5) | `/ministries/:id/finance/*` (MF-1 ministry UUID) |

## Models

- `MinistryFund` — general, welfare, project, event, emergency, custom
- `MinistryBudget` + `MinistryBudgetCategory`
- `MinistryExpense` — approval workflow
- `MinistryFundTransaction` — ledger entries (signed amounts)
- `MinistryFundTransfer` — internal fund movements

## Feature flag

`MinistrySettings.allowFinance` (default `true`)

## Permissions

`ministry.finance.view`, `.manage`, `.expense.create`, `.expense.approve`, `.report`  
Cross-ministry oversight: existing `ministry.finance.oversight`
