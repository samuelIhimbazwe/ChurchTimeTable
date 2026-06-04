# Asset Custodian (MF-4)

One **active** custodian per asset (`releasedAt` null).

Custody does not imply ownership. The custodian is accountable for physical condition and return.

## APIs

- `GET /assets/:id/custodian`
- `GET /assets/:id/custodian/history`
- `POST /assets/:id/custodian`
- `POST /assets/:id/custodian/transfer`
- `POST /assets/:id/custodian/release`

Permission: `asset.custodian.manage`
