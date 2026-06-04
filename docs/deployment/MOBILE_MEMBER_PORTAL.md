# Mobile Member Portal

## Web (complete)

Routes under `web/app/[locale]/(portal)/` and `web/features/member-portal/`.

APIs: `backend/src/member-portal/`

## Mobile (in progress)

- `mobile/lib/features/member_portal/screens/member_home_screen.dart` — static shell  
- Wire to `member-portal` APIs and register in `app_router.dart`  
- Offline: extend `member_portal_cache.dart` for dashboard, announcements, broadcasts  

## Target screens

Member home, membership center, broadcast center, notifications (read/unread/archive/search).
