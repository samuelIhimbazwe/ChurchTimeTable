# Asset Maintenance (MF-4)

## `AssetMaintenance`

Types: `REPAIR`, `SERVICE`, `INSPECTION`, `UPGRADE`

Supports `nextMaintenanceDate` for upcoming/overdue lists.

## APIs

- `GET /assets/:id/maintenance`
- `POST /assets/:id/maintenance`
- `PATCH /assets/:id/maintenance/:maintenanceId`
- `GET /assets/maintenance/upcoming`
- `GET /assets/maintenance/overdue`

Permission: `asset.maintain`
