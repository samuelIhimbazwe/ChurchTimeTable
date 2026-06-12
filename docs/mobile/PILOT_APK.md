# CMMS pilot APK (mobile)

Build a **separate** Android app for your boss. This does **not** change the Vercel web site or Render API configuration.

| Channel | URL / artifact |
|---------|----------------|
| **Web (boss testing now)** | https://church-time-table.vercel.app/login |
| **Mobile APK** | `mobile/build/cmms-pilot-release.apk` |
| **Shared API** | https://cmms-api-ywcy.onrender.com/api/v1 |

Mobile talks **directly** to the Render API (no CORS). Web and mobile can run at the same time.

---

## One-time setup (your PC)

1. Install [Flutter for Windows](https://docs.flutter.dev/get-started/install/windows)
2. Install [Android Studio](https://developer.android.com/studio) → SDK + accept licenses:
   ```powershell
   flutter doctor --android-licenses
   ```
3. Confirm:
   ```powershell
   flutter doctor
   ```
   Fix anything marked with ✗ before building.

---

## Build the APK

From repo root:

```powershell
.\mobile\scripts\build-pilot-apk.ps1
```

First run creates the `android/` folder automatically. APK output:

```
mobile\build\cmms-pilot-release.apk
```

Custom API (optional):

```powershell
.\mobile\scripts\build-pilot-apk.ps1 -ApiBase "https://cmms-api-ywcy.onrender.com/api/v1"
```

---

## Send to boss

1. Share the `.apk` file (Google Drive, WhatsApp, etc.)
2. On Android: **Settings → Security → Install unknown apps** (allow Files/Drive)
3. Open the APK → Install → Open

**Test accounts** (same as web): `Pilot@123`

| Role | Email |
|------|--------|
| Member | `member1@church.local` |
| Church coordinator | `church.coord@church.local` |
| Choir president | `choir.president@church.local` |
| Protocol president | `protocol.president@church.local` |

**Note:** First login after the API slept may take up to ~1 minute.

---

## Local dev (unchanged)

Emulator:

```powershell
cd mobile
flutter run --dart-define=CMMS_API_BASE=http://10.0.2.2:3000/api/v1
```

Phone on same Wi‑Fi as your PC:

```powershell
flutter run --dart-define=CMMS_API_BASE=http://YOUR_PC_IP:3000/api/v1
```

Local defaults are **not** changed by the pilot APK script.
