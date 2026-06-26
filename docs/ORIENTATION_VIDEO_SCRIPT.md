# CMMS Orientation Video — Script & Storyboard

**Target length:** 2–3 minutes  
**Audience:** New church members (web + mobile)  
**Tone:** Warm, clear, practical — “here’s your home, here’s how to find things”

---

## How to produce this video

1. Run the app locally (`web` on `:3001`, `backend` on `:3000`) or use a staging/demo church with **Training Mode** sample data (`docs/deployment/TRAINING_MODE.md`).
2. Use a screen recorder (OBS, Loom, or Windows Game Bar).
3. Follow the scenes below in order; pause 1–2 seconds on each highlighted UI element.
4. Optional: add subtitles in **English**, **French**, and **Kinyarwanda** (the app supports `/en`, `/fr`, `/rw`).

---

## Scene 1 — Welcome (0:00–0:15)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 1.1 | Church welcome / login page (`/login`) | “Welcome to your church’s management system — CMMS. Whether you serve in choir, protocol, or simply stay connected as a member, everything starts here.” |
| 1.2 | Click **Sign up** or **Log in** | “Create an account in a few steps, or sign in if you already have one.” |

---

## Scene 2 — Sign up & first login (0:15–0:35)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 2.1 | Registration steps (name → church relationship → interests → review) | “Registration asks who you are, your relationship with the church, and your interests — choir, protocol, or ministries. Choosing an interest does **not** enroll you automatically; it helps leaders know how to welcome you.” |
| 2.2 | Land on **Member Portal** (`/portal`) | “After you sign in, you arrive at the **Member Portal** — your personal home. This is where most members spend their time.” |
| 2.3 | First-login welcome prompt (if shown) | “On your first visit, a short welcome may appear. You can complete it or skip and explore on your own.” |

---

## Scene 3 — Member Portal tour (0:35–1:10)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 3.1 | Portal home widgets: verse, next service, announcements | “At the top you’ll see spiritual encouragement, your next service, and church announcements.” |
| 3.2 | **Quick actions** grid | “Quick actions take you to schedule, contributions, welfare, devotion, and more — the things members use most.” |
| 3.3 | **Participation** section (choir / protocol / ministries) | “The Participation area shows where you can get involved. If you’re not in a choir yet, tap **Discover choirs** to browse and send a join request.” |
| 3.4 | **My week** / activity feed | “My Week and Activity keep you updated on invitations, requests, and notifications.” |
| 3.5 | Sidebar or mobile menu | “On desktop, use the left sidebar. On mobile, tap the menu icon in the top-left. Your language can be changed in settings — English, French, or Kinyarwanda.” |

**Key portal routes to flash on screen:**

| What | Where |
|------|-------|
| Home | `/portal` |
| My schedule | `/portal/schedule` |
| Contributions | `/portal/contributions` |
| Church giving | `/portal/church-giving` |
| Welfare | `/portal/welfare` |
| Ministries | `/portal/ministries` |
| Profile | `/portal/profile` |
| Attendance | `/portal/attendance` |

---

## Scene 4 — Finding anything fast (1:10–1:25)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 4.1 | Press **Ctrl+K** (or click search) — Command Palette opens | “Can’t find something? Press **Ctrl+K** — or tap Search — to open the command palette.” |
| 4.2 | Type “schedule” or “music” — show results | “Type what you need: schedule, music, welfare, notifications. Jump straight there with one click.” |
| 4.3 | Bell icon — notifications | “The bell icon shows your notifications — rehearsal reminders, swap requests, and church updates.” |

---

## Scene 5 — Joining choir or protocol (1:25–1:50)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 5.1 | `/portal/choirs` — choir list + join request | “To join a choir, open **Choirs** from the portal, pick your choir, and submit a join request. A choir leader will review it.” |
| 5.2 | After approval — **Choir dashboard** entry button | “Once approved, a **Choir dashboard** button appears. That’s your workspace for rehearsals, music, and service assignments.” |
| 5.3 | `/portal/protocol` or protocol invitations | “Protocol works similarly — accept an invitation from a leader, or claim your existing service record if you already serve.” |

---

## Scene 6 — Choir member essentials (1:50–2:20)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 6.1 | Choir dashboard home (`/choir`) | “In the choir area, your dashboard shows what’s coming up — rehearsals, services, and action items.” |
| 6.2 | **Activities** / scheduling | “**Activities** lists rehearsals and services. Open one to see details, location, and attendance.” |
| 6.3 | **Music library** (`/choir/music`) | “The **Music library** has songs, lyrics, and favorites for practice.” |
| 6.4 | **Welfare** (`/choir/welfare`) | “**Welfare** lets you see care cases and contribute when your choir family needs support.” |
| 6.5 | Swaps / replacements (if visible) | “If you can’t make an assignment, use **Swaps** or **Replacements** to find coverage — your leaders approve the final change.” |

---

## Scene 7 — Protocol member essentials (2:20–2:40)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 7.1 | Protocol dashboard (`/protocol`) | “Protocol members have their own dashboard for service assignments and treasury.” |
| 7.2 | Replacements / contributions | “Check **Replacements** when you need a substitute, and **Contributions** for protocol giving.” |

---

## Scene 8 — Leaders & admins (2:40–2:55) *(optional — skip for member-only video)*

| Shot | On screen | Narration |
|------|-----------|-----------|
| 8.1 | Leader dashboard (`/dashboard`) | “Leaders and coordinators see an operational dashboard with pending approvals, attendance, and reports.” |
| 8.2 | Admin / import (`/admin`) | “Church admins manage members, imports, and church settings from the admin area.” |

---

## Scene 9 — Mobile app (2:55–3:10)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 9.1 | Mobile login → member home | “The mobile app mirrors the portal — schedule, contributions, choir, and notifications on the go.” |
| 9.2 | Pull-to-refresh / offline hint | “Pull down to refresh. Some content works offline after your first visit.” |

---

## Scene 10 — Closing (3:10–3:20)

| Shot | On screen | Narration |
|------|-----------|-----------|
| 10.1 | Portal home, smile / church branding | “That’s the essentials: start at the **Member Portal**, use **Search** when you’re lost, and explore choir or protocol when you’re ready to serve. Welcome — we’re glad you’re here.” |

---

## Quick-reference card (end screen / PDF handout)

```
┌─────────────────────────────────────────────────────────┐
│  CMMS — Where to find things                            │
├─────────────────────────────────────────────────────────┤
│  🏠  Home / overview      →  Member Portal (/portal)    │
│  📅  My schedule          →  Portal → Schedule          │
│  💰  Giving               →  Portal → Contributions     │
│  🎵  Choir (after join)   →  Choir dashboard (/choir)   │
│  📋  Protocol             →  Protocol dashboard         │
│  🔍  Find anything        →  Ctrl+K (search)            │
│  🔔  Updates              →  Notifications bell         │
│  👤  My account           →  Portal → Profile           │
│  🔑  Forgot password      →  Login → Forgot password    │
└─────────────────────────────────────────────────────────┘
```

---

## Recording checklist

- [ ] Demo account with realistic data (pilot seed or training mode)
- [ ] Browser at 1280×720 or 1920×1080, zoom 100%
- [ ] Hide personal email / test passwords in recording
- [ ] Record in one role path first (member), then optional leader cut
- [ ] Export MP4 (H.264), add captions, host on church site or embed in portal

---

## Suggested title & description (for YouTube / internal hosting)

**Title:** *CMMS Member Orientation — Your Church Portal in 3 Minutes*

**Description:** A short walkthrough of the Church Management & Coordination System: sign up, member portal, finding features with search, joining choir or protocol, and everyday tasks like schedule, music, welfare, and contributions.
