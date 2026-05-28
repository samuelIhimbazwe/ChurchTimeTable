# Pilot go-live checklist

Score each item **0** (not done) · **1** (partial) · **2** (done).  
**Minimum to start pilot: 28 / 40** (70%). Target for “solid pilot”: **34 / 40**.

## A. Infrastructure (max 10)

| # | Item | 0 | 1 | 2 |
|---|------|---|---|---|
| A1 | API reachable from leader phones (Wi‑Fi / HTTPS) | | | |
| A2 | Database backed up (daily copy of SQLite file or PostgreSQL dump) | | | |
| A3 | `JWT_SECRET` changed from dev default | | | |
| A4 | One person named as **pilot admin** (admin@church.local or real account) | | | |
| A5 | `npm run prisma:seed` + `npm run prisma:seed:pilot` run (or real members imported) | | | |

## B. People & roles (max 8)

| # | Item | 0 | 1 | 2 |
|---|------|---|---|---|
| B1 | Choir leader account created and tested login | | | |
| B2 | Protocol leader account created and tested login | | | |
| B3 | At least 5 active members have accounts | | | |
| B4 | Leaders trained on **calendar → assign → attendance** (30 min session) | | | |

## C. Sunday workflow (max 10)

| # | Item | 0 | 1 | 2 |
|---|------|---|---|---|
| C1 | Next 2 Sundays have events in calendar | | | |
| C2 | Assignments match real roster (not only seed data) | | | |
| C3 | Leader can mark bulk attendance after service | | | |
| C4 | Member can mark own attendance if absent from leader device | | | |
| C5 | Replacement request uses pickers (no UUID typing) | | | |

## D. Mobile app (max 8)

| # | Item | 0 | 1 | 2 |
|---|------|---|---|---|
| D1 | App installed on each leader device | | | |
| D2 | `CMMS_API_BASE` points to correct server IP | | | |
| D3 | Language set to **Kinyarwanda** (or agreed locale) | | | |
| D4 | Offline: attendance queues and sync screen retried after service | | | |

## E. Support & feedback (max 4)

| # | Item | 0 | 1 | 2 |
|---|------|---|---|---|
| E1 | WhatsApp / phone contact for “app not working” | | | |
| E2 | Weekly 15‑min review (conflicts, sync errors, leader feedback) | | | |

---

## Sign-off

| Role | Name | Date | Score |
|------|------|------|-------|
| Church admin | | | /40 |
| Choir leader | | | |
| Protocol leader | | | |

**Approved to start pilot:** ☐ Yes (≥28) · ☐ No — blockers: _______________
