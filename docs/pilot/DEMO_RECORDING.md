# Demo recording — clean data checklist

Run this **before every recording session** so screens show real numbers, queues, and names — not empty states.

## One command (recommended)

With the API running in another terminal:

```powershell
cd backend
npm run start:dev   # terminal 1

powershell -File scripts/prepare-demo-recording.ps1   # terminal 2
```

Without the API, the script still resets accounts, treasury, and protocol demo data; schedule/bulletin generation runs when the API is up.

## What gets prepared

| Area | Demo state |
|------|------------|
| **Branding** | Choir **Ijwi ry'Umwami Yesu**, church **ADEPR Kacyiru Parish**, readable occurrence titles |
| **Treasurer** | 3 budgets, active Umusanzu campaign, **3 items in verify queue**, MTD confirmed gifts |
| **Protocol teams** | Service I team **published**; Service II team **built (draft)** for publish demo |
| **Protocol queue** | Pending **replacement** request |
| **Protocol reports** | Rankings + attendance scores for current month |
| **Schedule** | Current month plan **generated → approved → published** (when API is running) |

## Verify before you hit Record

Log in and confirm these are **not empty**:

| Role | Login | Check |
|------|-------|-------|
| Protocol coordinator | `protocol.coordinator@church.local` | Schedule has weeks · Teams shows published + draft · Queue has replacement · Reports has rankings |
| Choir treasurer | `choir.treasurer@church.local` | Verify badge **≥ 1** · Budgets list populated · Stewardship MTD > 0 |
| Family head | `member1@church.local` | Family Alpha name · contributions history |
| Choir president | `choir.president@church.local` | Dashboard KPIs load |

Password for all pilot users: **`Pilot@123`**

## Manual reset (without full script)

```powershell
cd backend
npm run prisma:seed
npm run prisma:seed:pilot
npm run prisma:seed:demo-recording
```

## Recording environment

- **Web:** http://localhost:3001/login  
- **API:** http://localhost:3000/api/v1  
- Browser zoom **100%**, hide bookmarks bar  
- Use **presentation names** above — avoid showing “Pilot Family Alpha” or “Main Choir” in frame  

## Do not show on camera

- `pending.choir@church.local` / `pending.protocol@church.local` (onboarding edge cases)  
- Admin@123 on shared recordings unless demoing IT setup  
- Empty verify queue — re-run prepare script if treasurer badge is 0  

## Files

| File | Purpose |
|------|---------|
| `backend/prisma/seed-demo-recording.ts` | Idempotent presentation data |
| `backend/scripts/prepare-demo-recording.ps1` | Full reset + optional schedule publish |
