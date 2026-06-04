# Operations Engine (MF-7)

Local church scheduling foundation — separate from legacy `Event` / protocol workflows.

## Core entities

| Entity | Purpose |
|--------|---------|
| `OperationTemplate` | Reusable service definitions (Sunday 1/2, Tuesday, IGABURO) |
| `OperationOccurrence` | Scheduled instance with governance status |
| `AssignmentRequirement` | Required slots per occurrence |
| `OperationAssignment` | Unit assigned to an occurrence |
| `OperationNotification` | Reminders and workflow alerts |
| `OperationAssignment.attendanceId` | Future link to attendance (hooks only in MF-7) |

## API

Base: `/api/v1/operations`

See `backend/src/operations/operations.controller.ts`.

## Types

- `ChurchOperationType`: `SERVICE`, `SPECIAL_EVENT`
- `OperationOccurrenceStatus`: `DRAFT` → `UNDER_REVIEW` → `APPROVED` → `PUBLISHED` → `COMPLETED` / `CANCELLED`
- `OperationAssignmentType`: `MAIN_CHOIR`, `CHILDREN_CHOIR`, `PROTOCOL_TEAM`, `SERVICE_TEAM`, `CUSTOM`

## Multi-church readiness

All rows are church-local today (single SQLite DB). `churchId` can be added later without changing assignment/rule shape.
