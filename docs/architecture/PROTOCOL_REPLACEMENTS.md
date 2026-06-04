# Protocol Replacements

## Workflow

1. Original member creates `ReplacementRequest` (self-found or leader-assisted)
2. Status: `PENDING` → `APPROVED` | `REJECTED`
3. On approval:
   - Original assignment → `ABSENT_REPLACEMENT_FOUND`
   - Replacement added as `REPLACEMENT` team member

## API

```
POST /api/v1/protocol/replacements
{ teamMemberId, replacementMemberId, reason? }

PATCH /api/v1/protocol/replacements/:id
{ status: "APPROVED" | "REJECTED" }
```

## Permissions

- Members may request for their own assignment
- Leaders need `protocol.replacement.manage`

All approvals are audited.
