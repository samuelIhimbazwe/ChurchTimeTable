# Choir officer roles — Kinyarwanda titles & access matrix

Each church office is a **CMMS role** with its own **permissions**. Assign **one login per officer**.

## Titles (Ikinyarwanda)

| CMMS role | Ikinyarwanda | English |
|-----------|--------------|---------|
| `CHOIR_PRESIDENT` | Perezida wa Korali | Choir President |
| `CHOIR_VICE_PRESIDENT` | Perezida ushinzwe | Vice President |
| `CHOIR_SECRETARY` | Umunyamabanga wa Korali | Choir Secretary |
| `CHOIR_TREASURER` | Umubitsi wa Korali | Choir Treasurer |
| `CHOIR_REHEARSAL_DIRECTOR` | Umuyobozi w'imyitozo / amajwi | Rehearsal Director |
| `CHOIR_LOGISTICS` | Umuyobozi w'ibikoresho | Logistics / uniforms |
| `CHOIR_COMMITTEE` | Inteko ishinzwe Korali | Choir Committee (oversight) |

Stored in DB role `description` via `choir-officer-meta.ts`.

## Access matrix (default — edit in `seed.ts`)

Legend: ✅ = allowed · ❌ = blocked (API + app menu)

| Capability | Perezida | Perezida ushinzwe | Umunyamabanga | Umubitsi | Imyitozo | Ibikoresho | Inteko |
|------------|:--------:|:-----------------:|:-------------:|:--------:|:--------:|:----------:|:------:|
| View calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit events | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign members / rotation | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Mark attendance | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Approve swaps / replacements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View discipline cases | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage discipline | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View choir finance | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Edit finance / budgets | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Leader dashboard KPIs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change member status (admin) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Pilot test accounts

After `npm run prisma:seed` and `npm run prisma:seed:pilot`:

| Email | Role | Password |
|-------|------|----------|
| choir.president@church.local | `CHOIR_PRESIDENT` | `Pilot@123` |
| choir.vice@church.local | `CHOIR_VICE_PRESIDENT` | `Pilot@123` |
| choir.secretary@church.local | `CHOIR_SECRETARY` | `Pilot@123` |
| choir.treasurer@church.local | `CHOIR_TREASURER` | `Pilot@123` |
| choir.rehearsal@church.local | `CHOIR_REHEARSAL_DIRECTOR` | `Pilot@123` |
| choir.logistics@church.local | `CHOIR_LOGISTICS` | `Pilot@123` |
| choir.committee@church.local | `CHOIR_COMMITTEE` | `Pilot@123` |

**Try:** log in as treasurer → you should see **Finance** tiles only, not Assignments.

## Assign real officers

```powershell
cd backend
npm run prisma:seed

npx ts-node scripts/assign-user-role.ts perezida@itorero.local CHOIR_PRESIDENT --replace
npx ts-node scripts/assign-user-role.ts umunyamabanga@itorero.local CHOIR_SECRETARY --replace
npx ts-node scripts/assign-user-role.ts umubitsi@itorero.local CHOIR_TREASURER --replace
```

User must **log out and log in** after role changes.

## Customize one office

Example: secretary must **not** create events — remove `event:write` from `CHOIR_SECRETARY` in `backend/prisma/seed.ts`, then:

```powershell
npm run prisma:seed
```

Re-seed **replaces** all permissions per role (delete + recreate).

## Add a 7th office

1. Add `CHOIR_YOUTH_LEADER` to `roles.ts` and `choir-officer-meta.ts` (Kinyarwanda title).
2. Add permission array in `seed.ts`.
3. `npm run prisma:seed`
4. `assign-user-role.ts` for that person.

## Mobile app

`/auth/me` returns `permissions` and `roles`. Dashboard tiles follow permissions (treasurer does not see Assignments).

Role names shown under overview when KPIs are hidden (`report:export` missing).
