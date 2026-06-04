# Asset Assignment (MF-4)

Assignments track **where** an asset is used, independent of ownership.

## `AssetAssignment`

- `assignedToType`: `MINISTRY` | `OPERATIONAL_UNIT` | `MEMBER`
- `expectedReturnAt` / `returnedAt` for overdue reporting

## APIs

- `POST /assets/:id/assignments`
- `POST /assets/:id/assignments/:assignmentId/return`
- `POST /assets/:id/assignments/:assignmentId/transfer`
- `GET /assets/assignments/overdue`

Uniforms use the same assignment table — no `UniformAssignment` in MF-4.
