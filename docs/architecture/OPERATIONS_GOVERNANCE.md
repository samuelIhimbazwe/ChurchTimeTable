# Operations Governance (MF-7)

## Church leadership (`operations.manage`, `operations.schedule.*`)

- View all operations
- Approve and publish schedules
- Override assignments (`operations.override`)
- Resolve conflicts

## Ministry presidents

Use `operations.assignment.manage` (granted via church admin bundle) for choir/protocol slot assignment.

## Unit leaders (`operations.assignment.confirm`)

- Confirm or decline assignments
- View future schedule via `GET /operations/my-assignments`

Titles (Pastor, Choir President, etc.) come from MF-1/MF-2 leadership positions — permissions remain on `MinistryPermissionAssignment` / global roles.
