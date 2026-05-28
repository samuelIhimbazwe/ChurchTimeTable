# Church Management & Coordination System (CMMS)

Phase 1 — Choir + Protocol modules with unified event-driven architecture.

## Quick setup

```powershell
cd backend
npm install

# PostgreSQL via Docker (or SQLite fallback if Docker is off)
.\scripts\setup-db.ps1
# OR: .\scripts\setup-db.ps1 -SqliteOnly

# Pilot: roles + sample events/members/leaders
.\scripts\pilot-setup.ps1

npm run start:dev
```

API: `http://localhost:3000/api/v1`  
**Admin:** `admin@church.local` / `Admin@123`  
**Pilot guide:** [docs/pilot/README.md](docs/pilot/README.md) (leaders: `choir.leader@church.local` / `Pilot@123`)

## Feature checklist (Phase 1)

| Feature | Status |
|---------|--------|
| Auth + RBAC (JWT, roles, permissions) | Done |
| Unified event system | Done |
| Assignment + conflict engine (409) | Done |
| Attendance + 48h lock + hourly cron | Done |
| Swap workflow (request → accept → approve → finalize) | Done |
| Replacement workflow | Done |
| Audit logging | Done |
| Discipline 5-stage workflow | Done |
| Finance (transactions, dues, **budgets**) | Done |
| Member lifecycle transitions | Done |
| Choir **rotation** auto-assign | Done |
| Offline sync (Attendance, Member, Swap) | Done |
| In-app + **FCM** push notifications | Done (configure FCM env) |
| Reports + CSV + **PDF** export | Done |
| Responsibility **score trends** | Done |
| Super Admin system stats (`/system/stats`) | Done |
| Mobile screens (swap/replacement/leader/notifications) | Done |
| Unit + E2E tests | Done |

## PostgreSQL (production)

1. Start **Docker Desktop**
2. `docker compose up -d` in `backend/`
3. Set `DATABASE_URL` in `.env` (see `.env.example`)
4. Ensure `prisma/schema.prisma` uses `provider = "postgresql"`
5. `npx prisma migrate deploy && npm run prisma:seed`

## FCM (push notifications)

Backend `.env`:

```
FCM_PROJECT_ID=your-firebase-project-id
FCM_SERVER_KEY=your-legacy-server-key   # optional fallback
```

Mobile: add `google-services.json` (Android) / `GoogleService-Info.plist` (iOS) and run `flutterfire configure`.

## New API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/users/fcm-token` | Register device for push |
| GET | `/swaps` | List swaps (paginated) |
| GET | `/replacements` | List replacements |
| POST | `/choir/rotation/events/:id/assign` | Auto-assign choir rotation |
| GET | `/choir/rotation/pool/:eventId` | View rotation pool |
| POST | `/finance/budgets` | Create budget |
| GET | `/finance/budgets` | List budgets |
| GET | `/members/:id/scores/trends` | Monthly score trends |
| GET | `/reports/attendance/export/pdf` | PDF attendance report |
| GET | `/reports/finance/export/pdf` | PDF finance report |
| GET | `/system/stats` | Super Admin only |

## Mobile

```bash
cd mobile
flutter pub get
flutter run
```

Set API base URL in `lib/core/config/api_config.dart` or override it with
`--dart-define=CMMS_API_BASE=...`.

If the `mobile/` folder does not yet contain generated platform folders on your
machine, run `flutter create --platforms=android,ios,web .` once after
installing the Flutter SDK.

## Web

The browser platform now lives in `web/` as a separate `Next.js` app.

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Default local URL: `http://localhost:3001`

Required env:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

The web app uses locale-prefixed routes like `/en`, `/fr/login`, and
`/rw/dashboard`.

## Tests

```bash
cd backend
npm test
npm run test:e2e
```
