# Asset Reporting (MF-4)

## Endpoints

| Report | Path |
|--------|------|
| Inventory | `GET /assets/reports/inventory` |
| Ownership | `GET /assets/reports/ownership` |
| Assignments | `GET /assets/reports/assignments` |
| Maintenance | `GET /assets/reports/maintenance` |
| Losses | `GET /assets/reports/losses` |
| Valuation | `GET /assets/reports/valuation` |

## Export

`GET /assets/reports/inventory/export?format=csv|pdf`

Permission: `asset.report`

Results respect ownership visibility unless caller has global asset report access.
