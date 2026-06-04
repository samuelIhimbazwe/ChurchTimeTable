# Choir Module Go-Live Checklist

Verify each role can complete core workflows before Protocol MVP begins.

## President

- [ ] Open welfare dashboard and review urgent cases
- [ ] Approve or reject a welfare case with audit trail
- [ ] View welfare reports (category + monthly)
- [ ] Open choir reporting center export (PDF/CSV)
- [ ] Assign members to rehearsal events and edit rehearsal plan

## Treasurer

- [ ] Record welfare contribution (anonymous supported)
- [ ] Export welfare cases CSV/PDF
- [ ] View contribution stewardship (Sprint 10 — unchanged)

## Coordinator

- [ ] Create welfare case via wizard
- [ ] Transition case to fundraising and complete
- [ ] Browse music library and open song detail with assets
- [ ] View rehearsal readiness dashboard

## Secretary

- [ ] Search welfare cases, songs, and rehearsals globally
- [ ] Export choir summary reports

## Section Leader

- [ ] View rehearsal plan on event detail
- [ ] Mark section readiness via plan update (manage permission)
- [ ] Contribute to welfare case

## Member

- [ ] Submit welfare contribution on case detail
- [ ] Favorite a song
- [ ] View mobile welfare list (offline cache after first load)
- [ ] View mobile music library and song lyrics

## System

- [x] Backend e2e: `npm run test:e2e` — **171/171 green** (see `docs/certification/REGRESSION_REPORT.md`)
- [ ] Web Playwright: welfare, music, rehearsals specs (requires running servers)
- [x] Localization: en / fr / rw keys present for welfare, music, rehearsals, choirReports
- [x] Mobile choir keys: en / fr / rw ARB parity (run `flutter gen-l10n` after edits)

## Sign-off

| Role | Name | Date | Pass |
|------|------|------|------|
| Product | | | |
| Choir President | | | |
| Engineering | | | |
