# Pilot accounts

Created by `npm run prisma:seed` and `npm run prisma:seed:pilot`.

## System

| Role | Email | Password |
|------|-------|----------|
| Super admin | `admin@church.local` | `Admin@123` |

## Choir officers (separate logins — different menus)

| Office | Email | CMMS role | Password |
|--------|-------|-----------|----------|
| Perezida | `choir.president@church.local` | `CHOIR_PRESIDENT` | `Pilot@123` |
| Perezida ushinzwe | `choir.vice@church.local` | `CHOIR_VICE_PRESIDENT` | `Pilot@123` |
| Umunyamabanga | `choir.secretary@church.local` | `CHOIR_SECRETARY` | `Pilot@123` |
| Umubitsi | `choir.treasurer@church.local` | `CHOIR_TREASURER` | `Pilot@123` |
| Imyitozo | `choir.rehearsal@church.local` | `CHOIR_REHEARSAL_DIRECTOR` | `Pilot@123` |
| Ibikoresho | `choir.logistics@church.local` | `CHOIR_LOGISTICS` | `Pilot@123` |
| Inteko | `choir.committee@church.local` | `CHOIR_COMMITTEE` | `Pilot@123` |

See [CHOIR_OFFICER_ROLES.md](./CHOIR_OFFICER_ROLES.md) for what each login can do.

## Protocol

| Role | Email | Password |
|------|-------|----------|
| Protocol leader | `protocol.leader@church.local` | `Pilot@123` |

## Members (singers / protocol members)

| Email | Password |
|-------|----------|
| `member1@church.local` | `Pilot@123` |
| `member2@church.local` | `Pilot@123` |
| `member3@church.local` | `Pilot@123` |
| `member4@church.local` | `Pilot@123` |

**Before go-live:** change all passwords; map emails to real people with `assign-user-role.ts`.
