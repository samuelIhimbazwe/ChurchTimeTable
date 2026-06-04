# Ministry Budgets (MF-5)

Budgets track planned spending by category. Status: DRAFT → ACTIVE → CLOSED → ARCHIVED.

Category `remainingAmount` decreases when linked expenses are **paid**.

## APIs

- `GET/POST /ministries/:id/finance/budgets`
- `POST /ministries/:id/finance/budgets/:budgetId/activate`
