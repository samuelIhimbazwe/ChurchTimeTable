# Church Master Schedule — Sign-off Spec (v1)

**Purpose:** One church-wide weekly timetable for activities that use **church time + church place**. Ministries, choirs, and protocol **submit**; non-conflicting items **auto-publish**; conflicts are **held** for church admin. Church admin is always notified and can **manually add, edit, cancel, or override**.

**Out of scope:** Contributions, treasury, family finance, roster-only meetings with no building use, member personal calendars.

---

## 1. Roles

| Role | Submit | Auto-publish path | Master timetable | Conflict queue | Manual / override |
|------|--------|-------------------|------------------|----------------|-------------------|
| Ministry admin | Own ministry only | — | Read published | — | — |
| Choir admin | Own choir/unit only | — | Read published | — | — |
| Protocol admin | Protocol only | — | Read published | — | — |
| Church admin | Any + church-owned events | Receives notifications | Full | Resolve conflicts | Full |
| Super admin | Same as church admin (platform) | — | Full | Full | Full |

Sub-admins **never** publish to the master timetable directly.

---

## 2. Two schedule lanes

| Lane | Creator | Flow |
|------|---------|------|
| **Church-owned** | Church admin (pastors / church leadership) | Created directly on timetable (services, church-wide events). May **block** rooms (e.g. sanctuary Sunday AM). |
| **Submitted** | Ministry / choir / protocol admins | Submit → conflict check → auto-publish **or** hold |

---

## 3. Submission fields

| Field | Required | Notes |
|-------|----------|-------|
| `scopeType` | Yes | `MINISTRY` \| `CHOIR` \| `PROTOCOL` \| `OPERATIONAL_UNIT` |
| `scopeId` | Yes | ID of ministry, choir, protocol unit, etc. |
| `title` | Yes | e.g. "Elim rehearsal", "Women prayer" |
| `activityType` | Yes | See allowed types below |
| `date` | Yes | Calendar date |
| `startAt` / `endAt` | Yes | Local church time; end required for overlap math |
| `facilityId` | Yes | From **church room catalog** (no free-text-only) |
| `purpose` | No | Short description (SATB practice, monthly intercession) |
| `weekOf` | No | For weekly batch / digest grouping |
| `recurrence` | No | v1: single occurrence; v2: weekly series |
| `notes` | No | Internal note to church office |

### Allowed `activityType` (submittable)

`PRAYER`, `REHEARSAL`, `MEETING`, `TRAINING`, `CONCERT`, `FELLOWSHIP`, `OTHER_CHURCH_FACING`

### Excluded (reject on submit)

`CONTRIBUTION`, `FINANCE`, `FAMILY_ADMIN`, `ROSTER_ONLY`, `INTERNAL`

---

## 4. Room catalog

| Field | Required |
|-------|----------|
| `id`, `code`, `name` | Yes |
| `building` / `floor` | No |
| `capacity` | No |
| `isActive` | Yes |
| `requiresAdminNotify` | No | If true: always notify church admin on auto-publish (e.g. sanctuary) |

Examples: Sanctuary, Main Hall, Side Hall, Youth Room, Protocol Office.

---

## 5. Statuses

| Status | On master timetable? | Visible to submitter |
|--------|----------------------|----------------------|
| `DRAFT` | No | Yes |
| `SUBMITTED` | No | Yes (transient; immediately checked) |
| `AUTO_PUBLISHED` | **Yes** | Yes |
| `CONFLICT_HELD` | **No** | Yes |
| `ADMIN_PUBLISHED` | Yes | Yes (after admin resolve) |
| `REJECTED` | No | Yes |
| `CANCELLED` | No (removed if was published) | Yes |
| `COUNTER_PROPOSED` | No | Yes (admin suggested new slot) |

---

## 6. Core flow

```
Submit → conflict check (facilityId + [startAt, endAt) vs published + church-owned blocks)
  ├─ NO conflict  → AUTO_PUBLISHED → add to weekly timetable → notify submitter + church admin
  └─ YES conflict → CONFLICT_HELD   → notify submitter + church admin (action required)
```

**Re-check** on: submit, submitter edit, admin approve/override, concurrent second submit (loser → `CONFLICT_HELD`).

### Conflict rule (v1)

Hard conflict: same `facilityId` and overlapping `[startAt, endAt)` with any `AUTO_PUBLISHED`, `ADMIN_PUBLISHED`, or church-owned block.

### Alternatives (conflict queue)

Suggest up to 3 options:

1. Same room — nearest free slot same day  
2. Same time — nearest free room  
3. Same room — closest free slot ± same day  

Church admin picks, edits, rejects, or **override** (reason required, audited).

---

## 7. Church admin powers (always)

- Create / edit / cancel any timetable entry  
- Override conflict and force publish  
- Block room/time (church-owned)  
- Resolve `CONFLICT_HELD` (approve with change, reject, counter-propose)  
- Optional: revoke `AUTO_PUBLISHED` within configurable window (e.g. 24h)

---

## 8. Notifications

| Event | Submitter | Church admin | Priority |
|-------|-----------|--------------|----------|
| Auto-published | "Added to church schedule" | "Timetable updated: {title}" | Low |
| Conflict held | "Pending church office — clashes with …" | "**Action needed**: conflict …" | **High** |
| Admin published / counter-proposed | Yes | — | Medium |
| Rejected | Yes (with reason) | — | Medium |
| Cancelled / edited after publish | Yes | Yes | Medium |
| Daily digest (optional) | — | "N added; M need attention" | Low |

---

## 9. Permissions (new)

| Code | Grant to |
|------|----------|
| `church.schedule.submit` | Ministry / choir / protocol admins (scoped to own entity) |
| `church.schedule.view` | All above + church admin (published timetable) |
| `church.schedule.view.queue` | Church admin (conflict + held) |
| `church.schedule.manage` | Church admin (manual CRUD, blocks) |
| `church.schedule.resolve` | Church admin (conflict queue, override) |
| `church.facility.view` | Submitters + church admin |
| `church.facility.manage` | Church admin |

---

## 10. UI (v1 pages)

| Page | User | Purpose |
|------|------|---------|
| `/church/timetable` | Church admin | Weekly master view; filters by room, ministry, status |
| `/church/schedule/conflicts` | Church admin | Conflict queue only |
| `/church/schedule/submit` | Sub-admins | Create / draft / submit |
| `/church/schedule/mine` | Sub-admins | My submissions + status |
| `/church/facilities` | Church admin | Room catalog |

Church-owned services may link from existing `/church/calendar` or merge into timetable v2.

---

## 11. Data model (sketch)

**`ChurchFacility`** — room catalog  

**`ChurchScheduleEntry`** — one row on master timetable (published or block)  
- source: `CHURCH_DIRECT` \| `AUTO_PUBLISHED` \| `ADMIN_PUBLISHED` \| `OVERRIDE`  
- links to submission id when applicable  

**`ChurchScheduleSubmission`** — request pipeline (draft → submit → outcome)  

**`ChurchScheduleConflict`** — held conflict record + suggested alternatives JSON  

Audit: all auto-publish, override, manual edit, reject.

---

## 12. Build phases

| Phase | Deliverable |
|-------|-------------|
| **A** | `ChurchFacility` seed + `church.coord@church.local` + permissions — **done** |
| **B** | Submission CRUD + scoped submit for ministry/choir/protocol admins |
| **C** | Conflict engine + auto-publish vs `CONFLICT_HELD` |
| **D** | Church admin timetable + conflict queue UI |
| **E** | Notifications + daily digest |
| **F** | Recurrence, buffers, sanctuary always-notify |

---

## 13. Sign-off checklist

- [ ] Sub-admins submit only; no direct publish  
- [ ] No conflict → auto-add to weekly timetable + notify church admin  
- [ ] Conflict → not added; church admin resolves  
- [ ] Church admin can always manual add / edit / cancel / override  
- [ ] Contributions and internal finance excluded  
- [ ] Rooms from catalog; time range required  
- [ ] Permissions and pages as §9–10  

**Approved by:** _________________ **Date:** _________
