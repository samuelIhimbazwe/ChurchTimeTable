# Discipline lifecycle

## Actors

- Reporter (member/leader)
- Committee / church admin
- Subject member

## States

`REPORTED` → `UNDER_REVIEW` → `DECISION_PENDING` → `ACTIONED` → `CLOSED`

## Transitions

Managed via discipline module APIs; stages exposed in mobile via `disciplineStageLabel()`.

## Notifications

- Stage changes notify subject and assigned reviewers

## Audit log actions

- `DISCIPLINE_CASE_OPEN`, stage updates, resolution actions

## Offline behavior

- `DisciplineCase` sync entity supported in batch queue

## Conflict rules

- Cannot close without decision record when policy requires it
- RBAC: `DISCIPLINE_READ_ALL`, `DISCIPLINE_MANAGE`

## Localization considerations

- `discipline_stage_*` keys; discipline banner uses design tokens only
