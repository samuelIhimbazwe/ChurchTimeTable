# CMMS Platform Architecture

The platform has **two operational systems** on top of a shared member layer:

| Layer | Route | Purpose |
|-------|-------|---------|
| **Member Portal** | `/portal` | Personal home — schedule, devotion, giving, profile, choir discovery, protocol duties |
| **Choir System** | `/choir/*` | Choir operations — families, scheduling, music, welfare, finance, officer hubs |
| **Protocol System** | `/protocol/*` | Service teams, monthly scheduling, replacements, treasury, claims, rankings |

## Entry flow

1. Sign in → `/dashboard` redirects by role
2. Most users land on **Member Portal** (`/portal`)
3. Protocol officers may land on **Protocol** (`/protocol`)
4. Choir and protocol dashboards are opened deliberately from the portal or sidebar

## Shared backend

Auth, members, families, finance, operations, ministries (data layer for protocol), notifications, search, and messaging are shared infrastructure.

## Removed (legacy church CMS)

The former church-wide system (`/church/*`, `/admin/*`, `/system/*`) and its backend modules (church schedule, church intelligence, system admin, ministry-services UI, assets module) have been removed from the web app. Database tables may remain for migration compatibility.

## Clients

- **Web** — primary product (portal + choir + protocol)
- **Mobile** — choir/protocol/member-portal focused; church intelligence and ministries navigation removed
