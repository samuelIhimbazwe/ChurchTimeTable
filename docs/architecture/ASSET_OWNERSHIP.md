# Asset Ownership (MF-4)

## `AssetOwnership`

- `ownerType`: `CHURCH` | `MINISTRY` | `OPERATIONAL_UNIT`
- `ownerId`: ministry/unit UUID, or `CHURCH` for church-wide
- `ownershipPercentage` optional — when used, **must total 100%** per asset
- `contributedAmount` optional — alternative tracking without percentages

## APIs

- `GET /assets/:id/ownership`
- `POST /assets/:id/ownership`
- `PATCH /assets/:id/ownership/:ownershipId`
- `DELETE /assets/:id/ownership/:ownershipId`
- `GET /assets/:id/ownership/validate`

## Audit

`ASSET_OWNER_ADDED`, `ASSET_OWNER_REMOVED` + `AssetActivity.OWNERSHIP_CHANGED`
