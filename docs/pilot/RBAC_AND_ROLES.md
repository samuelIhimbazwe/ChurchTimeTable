# Leadership roles and access (RBAC)

CMMS separates **who you are in the church** (member profile / ministry) from **what you are allowed to do in the app** (roles and permissions).

## Two layers (do not confuse them)

| Layer | Stored in | Examples | Controls |
|-------|-----------|----------|----------|
| **Ministry / ground** | `Member.ministry`, `Event.ministryScope` | `CHOIR`, `PROTOCOL`, `BOTH` | Which events you can be assigned to; conflict rules (protocol quota, choir rotation) |
| **Role** | `UserRole` → `Role` → `Permission` | `CHOIR_LEADER`, `PROTOCOL_LEADER` | Which API actions work (create event, assign, approve swap, finance, etc.) |

A person can be **Protocol ministry** but hold **Choir leader** role only if you assign that role (unusual — usually ministry and role align).

---

## Finance stewardship (Sprint 8)

Ministry-scoped finance uses `choir.finance.*`, `protocol.finance.*`, and `ministry.finance.oversight` — not `report:export`. See **[FINANCE_STEWARDSHIP.md](./FINANCE_STEWARDSHIP.md)**.

## Choir officers (president, secretary, treasurer, …)

If the choir has **several leaders** with different duties, do **not** give everyone `CHOIR_LEADER`. Use separate roles (`CHOIR_PRESIDENT`, `CHOIR_SECRETARY`, `CHOIR_TREASURER`, …) — see **[CHOIR_OFFICER_ROLES.md](./CHOIR_OFFICER_ROLES.md)**.

## Built-in roles (today)

Defined in `backend/src/common/constants/roles.ts` and seeded in `backend/prisma/seed.ts`.

| Role | Typical person | Main permissions |
|------|----------------|------------------|
| `MEMBER` | Any singer / protocol member | View events |
| `CHOIR_LEADER` | Chef de chœur | Events, assignments, attendance, swaps, discipline, choir finance, reports |
| `PROTOCOL_LEADER` | Responsable protocol | Same as choir leader except no choir finance write |
| `CHOIR_COMMITTEE` | Komite | Read events, finance read, reports |
| `CHURCH_ADMIN` | Parish / coordination office | Almost everything except `sync:admin` |
| `SUPER_ADMIN` | IT / system owner | All permissions |

Full permission codes:

| Permission | Meaning |
|------------|---------|
| `event:read` | List/view events |
| `event:write` | Create/update/cancel events |
| `assignment:write` | Assign members, validate, bulk assign |
| `attendance:write` | Mark attendance, bulk, excused review |
| `swap:manage` | Approve/finalize swaps & replacements; see all pending as leader |
| `discipline:read_all` | View discipline cases |
| `discipline:manage` | Open/advance discipline |
| `finance:read` | View finance summary |
| `finance:write` | Transactions, budgets, dues |
| `member:manage` | Change member status |
| `report:export` | Reports, PDF, leader dashboard |
| `audit:read` | Audit log |
| `sync:admin` | System sync administration |

---

## How to customize access for an existing role

**Edit the permission list** in `backend/prisma/seed.ts` → `ROLE_PERMISSION_MAP`, then re-run seed (upserts permissions on roles):

```powershell
cd backend
npm run prisma:seed
```

Example: remove finance write from choir leader:

```typescript
[ROLES.CHOIR_LEADER]: [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.EVENT_WRITE,
  // ...
  PERMISSIONS.FINANCE_READ,   // keep read
  // remove PERMISSIONS.FINANCE_WRITE,
  PERMISSIONS.REPORT_EXPORT,
],
```

Users must **log out and log in again** (JWT loads permissions at login via `JwtStrategy`).

---

## How to add a new leadership role

Example: **Children choir leader** (`CHILDREN_CHOIR_LEADER`) with limited access.

### Step 1 — Register the role name (code)

`backend/src/common/constants/roles.ts`:

```typescript
export const ROLES = {
  // ...existing
  CHILDREN_CHOIR_LEADER: 'CHILDREN_CHOIR_LEADER',
} as const;
```

### Step 2 — Define its permissions (seed)

`backend/prisma/seed.ts`:

```typescript
[ROLES.CHILDREN_CHOIR_LEADER]: [
  PERMISSIONS.EVENT_READ,
  PERMISSIONS.EVENT_WRITE,
  PERMISSIONS.ASSIGNMENT_WRITE,
  PERMISSIONS.ATTENDANCE_WRITE,
  PERMISSIONS.SWAP_MANAGE,
  PERMISSIONS.REPORT_EXPORT,
],
```

### Step 3 — Apply to database

```powershell
npm run prisma:seed
```

### Step 4 — Assign the role to a user

Use the helper script (see below) or Prisma Studio:

```powershell
npx ts-node scripts/assign-user-role.ts leader@church.local CHILDREN_CHOIR_LEADER
```

### Step 5 — Mobile “leader” UI (optional)

The app treats anyone whose role name contains `LEADER` or `ADMIN` as a leader (`auth_provider.dart`). New role `CHILDREN_CHOIR_LEADER` will automatically get the leader dashboard.

If you use a name **without** `LEADER` (e.g. `COORDINATOR`), update `isLeader` in `mobile/lib/features/auth/providers/auth_provider.dart` or add permission-based checks (e.g. `report:export`).

### Step 6 — Rare: role-only endpoints

Some routes use `@Roles(ROLES.CHOIR_LEADER, ...)` instead of permissions (e.g. swap approve). Add your new role there if needed:

`backend/src/swaps/swaps.controller.ts`

---

## How to assign / change roles for a person

There is **no admin screen yet**. Options:

### A. Script (recommended for pilot)

```powershell
cd backend
npx ts-node scripts/assign-user-role.ts user@church.local CHOIR_LEADER
# Add second role without removing others:
npx ts-node scripts/assign-user-role.ts user@church.local CHOIR_COMMITTEE --add
# Replace all roles with one:
npx ts-node scripts/assign-user-role.ts user@church.local PROTOCOL_LEADER --replace
```

### B. Prisma Studio

```powershell
npx prisma studio
```

Open `User` → `userRoles` → link `roleId`.

### C. SQL (SQLite pilot DB)

Find user id and role id, insert into `UserRole`.

---

## Adding a new church “ground” (ministry area)

Example: **Usher / Hospitality** alongside Choir and Protocol.

This touches **data model + rules + UI**, not only roles.

| Step | File / area | Action |
|------|-------------|--------|
| 1 | `prisma/schema.prisma` | Add to `MinistryScope` enum, e.g. `USHER` |
| 2 | `prisma/schema.prisma` | Add `EventType` if needed, e.g. `USHER_SERVICE` |
| 3 | Migration | `npx prisma db push` or `migrate dev` |
| 4 | `assignments/conflict-detection.service.ts` | Add quota/overlap rules for the new type |
| 5 | `seed.ts` / new role | e.g. `USHER_LEADER` with permissions |
| 6 | Mobile ARB + `church_localization.dart` | Labels for new type/ministry |
| 7 | `ministry_accents.dart` | Color/icon for dashboards |
| 8 | Events | Create events with `ministryScope: USHER` |

Members get `ministry: USHER` on their profile; leaders get `USHER_LEADER` role.

---

## Choir vs protocol vs future grounds (rules)

| Area | Choir | Protocol | Custom |
|------|-------|----------|--------|
| Assignment conflict | Rotation, children → Service 1 only | Max 12/service, 3 services/month | Add in `ConflictDetectionService` |
| Event types | `CHOIR_SERVICE`, `REHEARSAL`, `CONCERT` | `PROTOCOL_SERVICE` | New enum values |
| Finance module | Choir finances in pilot | — | New module or shared `FINANCE` |

Roles do **not** automatically restrict a leader to only choir events — restriction is by **permission** + **ministry compatibility** on assign. A protocol leader with `event:write` can create a choir event unless you add extra checks (future enhancement: scope roles by ministry).

---

## Multiple roles per user

Supported: table `UserRole` is many-to-many.

Example: one person is both `CHOIR_LEADER` and `CHOIR_COMMITTEE` → permissions are the **union** of both roles (loaded in JWT).

---

## Security notes for production

- Change default passwords after pilot.
- Prefer **least privilege**: start with `MEMBER`, add leader roles only when needed.
- `CHURCH_ADMIN` / `SUPER_ADMIN` sparingly.
- After role changes, user must **re-login** to refresh JWT permissions.

---

## Governance alignment (Sprint 7 patch)

Operational authority for Protocol ministry uses **scoped permissions**, not `report:export` or generic `attendance:write` as stand-ins for president/coordinator/team-head power.

| Authority | Permission claims | Notes |
|-----------|-------------------|--------|
| Protocol president | `protocol.oversight` | Ministry-wide executive summaries; committee role `protocol_president` |
| Protocol coordinator | `protocol.team.manage`, `protocol.operational.monitor` | Team oversight, escalations; role `protocol_coordinator` |
| Protocol team head | `protocol.team.head`, `protocol.attendance.manage` | Scoped roster/attendance; also granted when assigned `ProtocolServiceTeam.teamHeadId` |
| Choir operations | `choir.oversight`, `choir.operations.manage`, … | Choir committee / officer bundles |

**Three sources of effective permissions** (merged at login / per request):

1. **System role** → `RolePermission` (e.g. `MEMBER`, `PROTOCOL_LEADER`)
2. **Committee assignment** → `ProtocolCommitteeRole.permissionsJson` (exposed as `committee:{ministryId}:{claim}`)
3. **Operational facts** → e.g. active protocol team head auto-adds `protocol.team.head`

Helpers: `backend/src/common/governance/governance-permissions.util.ts` (mirrored on web/mobile).

**Operational visibility** is built via `OperationalScopeService` → `OperationalScopeContext` (`actorUserId`, `scopedMemberIds`, `teamIds`, capability flags). Dashboard widgets, attendance/coverage summaries, and alerts filter through this context.

**Pilot governance users** (after `seed.ts` + `seed-pilot.ts`):

- `protocol.president@church.local` — committee president
- `protocol.coordinator@church.local` — committee coordinator
- `protocol.teamhead@church.local` — committee team head (+ optional team head on first active team)

Password: `Pilot@123` (same as other pilot accounts).

**Committee assignment UI (web):** `/dashboard/governance` — requires `committee.member.manage`, `committee.role.manage`, or `member:manage`. Assigns members to protocol (`protocol-ministry`) or choir (`default-choir`) committee roles.

**Mobile operational center:** route `/operational` — mirrors web `/dashboard/operational` using `GET /dashboard/operational/:role`.

## Roadmap (not built yet)

For day-to-day church admin without developers:

- Admin UI: list roles, tick permissions, assign roles to members
- Custom roles stored only in DB without editing `roles.ts`

Until then, use **seed + committee assignment + assign-user-role script** for pilot and small changes.
