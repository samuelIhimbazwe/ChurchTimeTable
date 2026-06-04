# Ministry Financial Reports (MF-5)

## Endpoints

| Report | Path |
|--------|------|
| Summary | `GET /ministries/:id/finance/summary` |
| Full bundle | `GET /ministries/:id/finance/reports?year=` |
| Export | `GET /ministries/:id/finance/reports/export?format=csv\|pdf` |

Includes fund balances, budget utilization, expense summaries, category spending, year summary.

Permission: `ministry.finance.report`
