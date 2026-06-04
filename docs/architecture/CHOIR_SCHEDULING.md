# Choir Scheduling

## Schedule plans

`POST /choir/scheduling/plans/generate` creates a `ChoirSchedulePlan` (MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL) and auto-assigns choirs for service occurrences in the date range using eligibility and rotation history.

## Weekly adjustments

`POST /choir/scheduling/adjustments` supports:

- `REPLACE` — cancel prior choir, assign new
- `ADD_SUPPORTING` — extra supporting choir
- `CANCEL` — cancel assignment
- `MOVE`, `RESCHEDULE` — recorded for audit (extend as needed)

## Manual assignment

- `GET .../recommendations` — rule-based recommendations
- `POST /assignments` — manual assign with optional override reason
- `POST .../auto-assign` — apply all recommendations

Nothing is locked after generation; leaders can swap, add, or remove choirs at any time.
