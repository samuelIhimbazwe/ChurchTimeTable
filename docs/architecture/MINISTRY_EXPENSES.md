# Ministry Expenses (MF-5)

Workflow: DRAFT → SUBMITTED → APPROVED → PAID (or REJECTED / VOID).

Payment creates a negative `MinistryFundTransaction` and updates budget category spend.

## APIs

- `GET/POST /ministries/:id/finance/expenses`
- `POST .../submit`, `/approve`, `/reject`, `/pay`

Permissions: `ministry.finance.expense.create`, `.expense.approve`
