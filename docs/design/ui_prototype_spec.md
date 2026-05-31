# CMMS UI prototype specification

**Source:** two approved prototype images (desktop multi-screen board + mobile web/native board).

**Purpose:** This is the **product UI template spec** — screen structure, features, components, and navigation — not just color tokens. Implementation should match these layouts section-by-section, wired to real API data.

**Related:** [light_mode_reference.md](light_mode_reference.md) (tokens), [dark_mode.md](dark_mode.md) (optional override).

---

## Coverage model

| Tier | Meaning |
|------|---------|
| **Drawn** | Layout appears explicitly in the prototype images |
| **Derived** | Not a separate mockup frame, but fully spec’d by applying the same template grammar (cards, KPIs, tables, tabs, donuts) to that feature |

The prototype is a **system template**, not just eight isolated screens. Any CMMS feature should follow the same rules: shell header → KPI row (if metrics exist) → primary card(s) → secondary chart/table → actions in the top-right of the relevant card.

---

## Global application shell

### Desktop (≥ lg)

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│ SIDEBAR      │ TOP HEADER CARD                                          │
│ ~260px       │ [Page title H1] [subtitle]     [search] [🔔] [avatar]   │
│              ├──────────────────────────────────────────────────────────┤
│ Logo         │                                                          │
│ Nav links    │ MAIN CONTENT — stacked cards / grids                       │
│              │                                                          │
│ User chip    │                                                          │
└──────────────┴──────────────────────────────────────────────────────────┘
```

**Sidebar nav (fixed order in prototype):**

1. Dashboard  
2. Members  
3. Ministries  
4. Attendance  
5. Events  
6. Protocol Teams  
7. Governance  
8. Finance  
9. Reports  
10. Settings  

**Sidebar footer:** user avatar, display name, role label (e.g. “Committee Leader”).

**Active nav:** filled primary blue background, white label + icon.

**Page header card:**

- H1 = current screen name (or “Dashboard” + greeting on home)  
- Subtitle = one-line context  
- Global search field (placeholder: “Search…”)  
- Notification bell (optional unread dot)  
- User avatar / name chip (desktop header)  

**Rule:** Shell owns the page H1. Feature screens use **section titles inside cards only** — no duplicate top-level headings.

### Mobile web (responsive)

- Top bar: hamburger | logo “CMMS” | notification bell  
- Hamburger opens **full-height drawer** with same nav items as desktop + user profile at bottom  
- Content stacks vertically; KPI grid becomes **2×2**  
- Tables become **card lists** where shown in mobile board  

### Native mobile (Flutter)

- **Bottom tabs:** Home · Members · Events · More  
- Header: hamburger (opens drawer on some screens) | title | notification bell  
- **FAB** on Members tab (+ add member)  
- **More** screen lists secondary routes with chevrons + red Logout at bottom  

**More menu items (native):** Protocol Teams, Governance, Finance, Reports, Documents, Settings, Help & Support, Logout.

---

## Design system (from prototype)

### Visual language

- Light mode default; calm church operations feel  
- White cards on light gray canvas; subtle border + shadow  
- Radius ~12–16px on cards; pill badges  
- Primary blue for actions, active nav, chart emphasis  
- Green = success/active; orange = pending; red = reject/danger/logout  

### Reusable components

| Component | Usage |
|-----------|--------|
| **Stat KPI card** | Label, large value, optional trend line (+12 this month, +5% vs last month) |
| **Status badge** | Active (green), Pending (orange), Inactive (gray), ministry tags (blue/info) |
| **Data table** | Sticky header, avatar in name column, actions ⋮ menu |
| **Pagination footer** | “Showing 1 to 7 of 248 members” + page controls |
| **Donut chart** | Center percentage + legend segments |
| **Line chart** | Two series: This Month (solid) vs Last Month (dotted) |
| **Progress bar** | Horizontal bar for ministry capacity / daily attendance |
| **Calendar grid** | Month view; colored event pills in cells |
| **Segmented control** | Calendar / List toggle |
| **Tabs** | Filter tabs (All / Active / Pending / Inactive) or section tabs |
| **Activity feed** | Icon + description + timestamp rows |
| **Member row card** | Avatar, name, ministry • role, status badge, date, ⋮ |
| **Primary button** | Blue filled (+ Add Member, + Create Event, Approve) |
| **Secondary button** | Outlined (Filter, Edit Profile) |
| **Danger button** | Red outlined/filled (Reject, Logout) |

---

## Screen specifications (desktop)

Each screen lists **sections top-to-bottom**, **layout grid**, **data fields**, and **actions**.

Suggested CMMS routes are in parentheses for implementation mapping.

---

### 1. Dashboard Overview (`/dashboard`)

**Header:** Title “Dashboard”; greeting “Welcome back, {name}” may appear in content area.

#### Section A — KPI row (4 columns)

| Card | Primary value | Secondary / trend |
|------|---------------|-------------------|
| Active Members | 248 | +12 this month ↑ |
| Upcoming Events | 8 | 2 today |
| Attendance Rate | 92% | +5% vs last month ↑ |
| Total Contributions | 2,450,000 RWF | +8% vs last month ↑ |

#### Section B — Two columns (≈ 60/40)

**Left: Upcoming Events card**

- Card title: “Upcoming Events”  
- List rows, each with: event name, date + time, location, category badge (Choir / Main / Protocol)  
- Example events: Choir Rehearsal, Sunday Service, Protocol Duty  

**Right: Recent Activity card**

- Card title: “Recent Activity”  
- Feed items: actor + action + relative time  
- Examples: “Marie Irankunda marked attendance”, “New member registered”, “Protocol team updated”  

#### Section C — Ministry Overview (full width)

- Card title: “Ministry Overview”  
- Rows: ministry name, member count, horizontal progress bar (% of capacity or goal)  
- Ministries shown: Choir, Protocol, Children Choir (examples)  
- Footer action: **+ Add Ministry** (ghost/secondary)  

**Mobile adaptation:** KPI 2×2 grid; events and activity stack; ministry list full width.

---

### 2. Members List (`/dashboard/members`)

#### Section A — Toolbar (inside card or header row)

- Search input (“Search members…”)  
- **Filter** button (secondary)  
- **+ Add Member** button (primary, right-aligned)  

#### Section B — Status tabs

`All` | `Active` | `Pending` | `Inactive`

#### Section C — Data table

| Column | Content |
|--------|---------|
| Name | Avatar + full name |
| Ministry | Badge or text (Choir, Protocol, …) |
| Role | Member, Leader, … |
| Status | Badge: Active (green), Pending (orange), Inactive (gray) |
| Joined | Date |
| Actions | ⋮ menu (view, edit, deactivate — implement as needed) |

#### Section D — Pagination

- “Showing 1 to 7 of 248 members”  
- Page numbers + prev/next  

**Mobile adaptation:** Search bar full width; filter icon; member **card list** instead of table; FAB (+) on native.

**Row click:** navigates to Member Profile.

---

### 3. Attendance Overview (`/dashboard/attendance`)

**Note:** Prototype shows an **analytics overview**, distinct from operational marking flows. Both may coexist (overview as default tab).

#### Section A — Date range picker

- e.g. “May 12 – May 18, 2025” with calendar control  

#### Section B — Summary KPI row (4 columns)

| Card | Value | Subtext |
|------|-------|---------|
| Present | 194 | 88% |
| Absent | 28 | 12% |
| Late | 6 | 5% |
| Excused | — | (count + % as shown) |

#### Section C — Two columns

**Left: Daily Attendance table**

| Date | Present | Absent | Late | Excused | Rate |
|------|---------|--------|------|---------|------|

**Right column (stacked):**

1. **Overall Rate** — large donut, center 92%  
2. **Attendance by Ministry** — list of ministries with % per row  

**Mobile adaptation:** Three summary stats in a row; donut centered; **daily bars** (Mon–Fri horizontal progress) instead of full table.

---

### 4. Events Calendar (`/dashboard/events`)

#### Section A — Toolbar

- Segmented toggle: **Calendar** | **List**  
- **+ Create Event** (primary)  

#### Section B — Calendar view (default)

- Month/year label with prev/next arrows  
- 7-column grid (Sun–Sat)  
- Event pills in cells, color by category/ministry  
- Examples: Choir Rehearsal (blue), Sunday Service (green), Protocol Training (blue)  

#### Section B alternate — List view (inferred)

- Chronological event list with same fields as dashboard upcoming events  
- Not shown in mockup — use card rows consistent with Upcoming Events  

**Mobile adaptation:** Same calendar grid (compact); selected-day agenda list below with time, location, badges.

---

### 5. Protocol Teams (`/dashboard/protocol-teams`)

#### Section A — Section tabs

`Overview` | `Teams` | `Assignments`

*(Only Overview is fully mocked; other tabs follow same card/table patterns.)*

#### Section B — KPI row (4 columns)

| Card | Example value |
|------|---------------|
| Teams Generated | 16 |
| Members Assigned | 96 |
| Coverage Rate | 92% |
| Pending Assignments | 4 |

#### Section C — Two columns

**Left: Teams by Group**

- Rows: group name, date, member count, mini coverage progress bar  

**Right: Team Summary**

- Donut chart: Assigned / Pending / Unassigned  
- Center label: overall coverage %  

**CMMS mapping:** Protocol team generation, assignments, coverage APIs.

---

### 6. Finance Overview (`/dashboard/finance`)

#### Section A — KPI row (3–4 columns)

| Card | Example |
|------|---------|
| Total Contributions | 2,450,000 RWF + trend |
| Dues Collected | amount + trend |
| Other Income | amount + trend |
| Total Income | (if fourth card) |

#### Section B — Two columns

**Left: Income Trend**

- Line chart, X = time within month  
- Series: This Month (solid blue), Last Month (dotted gray)  

**Right: Recent Transactions**

- Rows: icon, title (e.g. “Sunday Collection”), date, amount (RWF)  

---

### 7. Member Profile (`/dashboard/members/[id]`)

#### Section A — Profile header card

- Large avatar  
- Name (H2 inside card)  
- Status badge (Active)  
- Role + joined date  
- **Edit Profile** button (secondary, right)  

#### Section B — Internal layout (sidebar tabs + content)

**Vertical tabs:** Overview | Attendance | Events | Contributions  

**Overview tab — two-column info grid:**

| Personal Information | Ministry Information |
|---------------------|----------------------|
| Email | Ministry |
| Phone | Role |
| Address | Voice type (choir) |
| Date of birth | Joined date |

**Other tabs (derived from Attendance / Events / Finance screens, scoped to one member):**

| Tab | Layout |
|-----|--------|
| **Attendance** | Date range + 4 KPI mini-cards; donut (member rate); table of recent attendance rows with status badges |
| **Events** | Upcoming + past event card list (same row pattern as Dashboard Upcoming Events) |
| **Contributions** | Progress bar + paid/outstanding stat cards; recent contribution rows with paid/pending badges |

---

### 8. Pending Approvals (`/dashboard/members/pending`) — **Drawn**

#### Section A — Summary line

- “4 Pending Members” (count headline)  

#### Section B — Two columns

**Left: Pending members table**

| Name | Ministry | Applied On | Actions |
|------|----------|------------|---------|
| … | … | date | **Approve** (green) **Reject** (red) |

**Right: Approval Summary**

- Donut chart: pending count in center  
- Legend: breakdown by ministry  

---

## Derived screens (same template, not a separate mockup frame)

These follow the prototype grammar exactly. They are **part of the spec**, not placeholders.

---

### 9. Ministries (`/dashboard/ministries`) — **Derived**

Extends Dashboard “Ministry Overview” into a full management screen.

#### Section A — KPI row (3 columns)

| Card | Example |
|------|---------|
| Total Ministries | 3 |
| Total Members | 248 |
| Avg. Capacity Used | 78% |

#### Section B — Toolbar card

- Search ministries  
- **+ Add Ministry** (primary)  

#### Section C — Ministry grid (2 columns on desktop)

Each ministry **card**:

- Ministry name + info badge (Choir / Protocol / Children)  
- Member count (e.g. 142 members)  
- Horizontal progress bar (capacity / active rate)  
- Row actions: **View members** (link) · **Manage** (⋮)  

**Mobile:** stacked full-width cards.

---

### 10. Governance (`/dashboard/governance`) — **Derived**

Committee and role management using Members + Protocol Teams patterns.

#### Section A — Tabs

`Committee Roles` | `Assignments` | `Protocol` | `Choir`

#### Section B — KPI row (when Assignments tab)

| Card | Example |
|------|---------|
| Roles Defined | 12 |
| Members Assigned | 34 |
| Open Seats | 2 |
| Last Updated | date |

#### Section C — Primary table card

| Column | Content |
|--------|---------|
| Role | Role name |
| Ministry | Badge |
| Holder | Avatar + name or “Vacant” |
| Since | Date |
| Actions | Assign · Remove (⋮) |

#### Section D — Side panel (optional, 2-column layout)

- **Role distribution** donut (filled vs vacant)  
- **Recent changes** activity feed (same component as Dashboard Recent Activity)  

---

### 11. Reports (`/dashboard/reports`) — **Derived**

Export hub using Finance “Recent Transactions” list pattern.

#### Section A — Category tabs

`Attendance` | `Finance` | `Discipline` | `Protocol`

#### Section B — Report cards grid (2 columns)

Each card:

- Report title + one-line description  
- Last generated date (muted)  
- Format chips: PDF · CSV  
- **Generate** (secondary) · **Download** (primary when ready)  

#### Section C — Recent exports table

| Report | Generated | Format | Actions |
|--------|-----------|--------|---------|
| … | datetime | PDF | Download |

**Mobile:** stacked cards; native under **More → Reports**.

---

### 12. Settings (`/dashboard/settings`) — **Derived**

Uses native **More** screen list pattern on mobile; grouped cards on desktop.

#### Section A — Settings groups (stacked cards)

**Appearance**

- Theme: Light · Dark · System (segmented control — matches existing theme toggle)  
- Language: locale switcher  

**Account**

- Name, email (read-only rows)  
- Change password (link/button)  

**Notifications**

- Toggle rows: email, push, assignment reminders, approval alerts  

**Ministry workspace** (leaders only)

- Default ministry scope  

Footer: **Logout** (danger text/button — matches native More screen).

---

### 13. Events — List view (`/dashboard/events` list tab) — **Derived**

When user selects **List** on Events screen:

- Same toolbar as Calendar view (toggle + Create Event)  
- Chronological **card list** (not table): event name, date/time, location, ministry badge  
- Optional filter chips: All · Choir · Protocol · Main  
- Empty state: “No events this month” + Create Event CTA  

---

### 14. Protocol Teams — Teams tab — **Derived**

#### KPI row

Teams this month · Active groups · Members per team avg · Unassigned slots  

#### Main table

| Group | Service date | Members | Coverage | Actions |
|-------|--------------|---------|----------|---------|
| … | … | 6/6 | 100% bar | View · Edit |

---

### 15. Protocol Teams — Assignments tab — **Derived**

Two columns (same as Overview):

**Left:** assignment queue table — Member · Role · Event · Status badge (Assigned / Pending)  
**Right:** coverage donut + legend  

Primary action in toolbar: **Generate teams** (primary button).

---

### 16. Shared modals / forms — **Derived**

All modals: white card, rounded, title + subtitle, form fields, Cancel + primary Save.

| Modal | Fields | Actions |
|-------|--------|---------|
| **Add Member** | Name, email, phone, ministry select, role | Cancel · **Add Member** |
| **Create Event** | Title, type, ministry, date/time, location, recurrence | Cancel · **Create Event** |
| **Edit Profile** | Same as Member Profile personal fields | Cancel · **Save** |
| **Add Ministry** | Name, description, capacity target | Cancel · **Add** |
| **Filter** (members) | Ministry, role, status, date joined range | Reset · **Apply** |

---

### 17. Auth screens — **Derived**

Split layout (marketing hero left, form card right) — already in codebase direction:

| Screen | Card content |
|--------|--------------|
| Login | Email, password, Sign in, forgot password link |
| Register | Name, email, ministry, password, submit |
| Forgot password | Email, send reset link |
| Pending approval | Status message + support contact |

---

## Mobile screen matrix

| Screen | Web mobile | Native |
|--------|------------|--------|
| Dashboard | Drawer nav; 2×2 KPIs; stacked events | Bottom tab: Home |
| Members | Drawer; card list; search | Tab + FAB |
| Attendance | Drawer; donut + daily bars | Reachable via drawer / More |
| Events | Drawer; calendar + day agenda | Bottom tab: Events |
| Full nav | Drawer (all 10 items + profile) | More tab (secondary items) |
| Logout | Drawer or profile | Red text at bottom of More |

---

## Route map (prototype → CMMS)

| Prototype screen | Route | Tier |
|------------------|-------|------|
| Dashboard | `/dashboard` | Drawn |
| Members | `/dashboard/members` | Drawn |
| Member Profile | `/dashboard/members/[id]` | Drawn (+ derived sub-tabs) |
| Pending Approvals | `/dashboard/members/pending` | Drawn |
| Attendance Overview | `/dashboard/attendance` | Drawn |
| Events (calendar + list) | `/dashboard/events` | Drawn + derived list |
| Protocol Teams | `/dashboard/protocol-teams` | Drawn + derived tabs |
| Finance | `/dashboard/finance` | Drawn |
| Ministries | `/dashboard/ministries` | Derived |
| Governance | `/dashboard/governance` | Derived |
| Reports | `/dashboard/reports` | Derived |
| Settings | `/dashboard/settings` | Derived |
| Auth | `/login`, `/register`, … | Derived |

---

## Implementation order (agreed workflow)

Build **one screen at a time**, prototype-faithful:

1. Dashboard  
2. Members + Member Profile (+ sub-tabs)  
3. Pending Approvals  
4. Attendance Overview  
5. Events (calendar + list)  
6. Protocol Teams (all tabs)  
7. Finance  
8. Ministries  
9. Governance  
10. Reports  
11. Settings  
12. Auth screens + shared modals  
13. Mobile web responsive pass per screen  
14. Native mobile pass per screen  

For each screen: match **section order, grid columns, components, and actions** before moving on.

---

## Prototype asset locations

Reference images (Cursor workspace assets):

- Desktop board: `assets/...ChatGPT_Image_May_30__2026__12_45_32_AM-....png`  
- Mobile board: `assets/...ChatGPT_Image_May_30__2026__12_37_34_PM-....png`  

Copy into `docs/design/mockups/` when committing to the repo.

---

## Acceptance checklist (per screen)

- [ ] Section layout matches prototype grid (column counts, card order)  
- [ ] All labeled KPIs / columns / actions present  
- [ ] Uses shared CMMS components (not one-off styling)  
- [ ] Shell owns page title; no duplicate H1 in feature body  
- [ ] Mobile web layout matches mobile board where applicable  
- [ ] Native screen matches native board where applicable  
- [ ] i18n keys added for `en`, `fr`, `rw`  
- [ ] Wired to API (or explicit empty state if backend pending)  
