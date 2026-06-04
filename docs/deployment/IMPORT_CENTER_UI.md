# Import Center UI

## Location

- **Web:** `/dashboard/admin/deployment/imports`
- **API:** `/api/v1/imports`

## Wizard steps

1. **Choose type** — Members, choir members, protocol members, ministries, ministry members, leadership assignments, assets, schedules.
2. **Upload** — CSV or XLSX.
3. **Preview** — Valid, invalid, warnings, duplicates, conflicts.
4. **Conflict strategy** — SKIP, REPLACE, MERGE, MANUAL_REVIEW.
5. **Confirm** — Final applied / failed / skipped report.

## Import history

Toggle **Import history** on the same page to review past jobs: type, uploader, date, status, records imported, errors.

## Permissions

Requires `pilot.import.manage` or `admin.users.manage`.

## Tips

- Use UTF-8 CSV for best results.
- Excel files are read from the first worksheet.
- Resolve conflicts before confirming when using MANUAL_REVIEW.
