# Choir + Protocol Go-Live Checklist

Verify each role can complete core workflows before expanding beyond the pilot church.

**Pilot password:** `Pilot@123` (church admin: `Admin@123`) — see [ACCOUNTS.md](./ACCOUNTS.md).

**Runbook:** [PILOT_RUNBOOK.md](./PILOT_RUNBOOK.md) · **Protocol gate:** [PROTOCOL_MODULE_COMPLETION.md](./PROTOCOL_MODULE_COMPLETION.md) · **Choir gate:** [CHOIR_MODULE_COMPLETION.md](./CHOIR_MODULE_COMPLETION.md)

---

## Choir — President

- [ ] Open welfare dashboard and review urgent cases
- [ ] Approve or reject a welfare case with audit trail
- [ ] View welfare reports (category + monthly)
- [ ] Open choir reporting center export (PDF/CSV)
- [ ] Assign members to rehearsal events and edit rehearsal plan

## Choir — Treasurer

- [ ] Record welfare contribution (anonymous supported)
- [ ] Export welfare cases CSV/PDF
- [ ] Verify family-approved claims in treasurer verification console
- [ ] Confirm sponsor gifts in sponsor queue

## Choir — Coordinator

- [ ] Create welfare case via wizard
- [ ] Transition case to fundraising and complete
- [ ] Browse music library and open song detail with assets
- [ ] View rehearsal readiness dashboard

## Choir — Secretary

- [ ] Search welfare cases, songs, and rehearsals globally
- [ ] Export choir summary reports

## Choir — Section Leader

- [ ] View rehearsal plan on event detail
- [ ] Mark section readiness via plan update (manage permission)
- [ ] Contribute to welfare case

## Choir — Member

- [ ] Submit welfare contribution on case detail
- [ ] Favorite a song
- [ ] View mobile welfare list (offline cache after first load)
- [ ] View mobile music library and song lyrics

---

## Protocol — Coordinator (`protocol.coordinator@church.local`)

- [ ] Open coordinator command home (`/protocol/coordinator`)
- [ ] Build team from MF-7 occurrence (`/protocol/teams/generate`) — church calendar link works
- [ ] Publish roster from teams publish queue (`/protocol/teams`)
- [ ] Approve replacement in replacements console (`/protocol/replacements`)

## Protocol — President (`protocol.leader@church.local`)

- [ ] Open president command home (`/protocol/president`)
- [ ] Review claims console (`/protocol/claims`)
- [ ] Generate monthly rankings (`/protocol/rankings`)
- [ ] Download ministry health pack (`/protocol/reports`)

## Protocol — Team head (`protocol.teamhead@church.local`)

- [ ] Open team detail for published service (`/protocol/teams/[occurrenceId]`)
- [ ] Mark attendance outcomes for all members
- [ ] Submit team report if required

## Protocol — Treasurer (`protocol.treasurer@church.local`)

- [ ] Open treasury hub (`/protocol/treasury`)
- [ ] Confirm pending protocol unity contribution in inbox
- [ ] Export stewardship CSV/PDF from treasury exports card

## Protocol — Secretary (`protocol.secretary@church.local`)

- [ ] Open secretary desk (`/protocol/secretary`)
- [ ] View ministry documents shelf (`/protocol/documents`)
- [ ] Browse member roster + 360 panel

## Protocol — Member (any protocol pilot account)

- [ ] View assignments on protocol home (`/portal/protocol` or mobile Protocol)
- [ ] Submit replacement request (web console or mobile)
- [ ] Submit protocol contribution (`/portal/protocol/contributions`)
- [ ] Tap assignment notification → lands on correct team page (`/protocol/teams/{occurrenceId}`)

## Protocol — Admin

- [ ] Import protocol members CSV via Import Center (`/admin/import` → `PROTOCOL_MEMBERS`)
- [ ] Preview → confirm import job completes

---

## System

- [x] Backend e2e: `npm run test:e2e` — see `docs/certification/REGRESSION_REPORT.md`
- [ ] Web Playwright: welfare, music, rehearsals, protocol smoke (requires running servers)
- [x] Localization: en / fr / rw keys for welfare, music, rehearsals, choir reports
- [x] Mobile choir keys: en / fr / rw ARB parity (run `flutter gen-l10n` after edits)
- [x] Protocol module completion tracker — waves P0–P7 marked done in `PROTOCOL_MODULE_COMPLETION.md`
- [x] Shared contribution inbox components (`MinistryContributionPendingInbox`)

---

## Sign-off

| Role | Name | Date | Pass |
|------|------|------|------|
| Product | | | |
| Choir President | | | |
| Protocol President | | | |
| Engineering | | | |
