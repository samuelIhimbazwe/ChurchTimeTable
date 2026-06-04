# Ministry Activity Feed (MF-3)

Append-only `MinistryActivity` rows power dashboards, activity tabs, and filtered feeds.

## Types

`ANNOUNCEMENT_CREATED`, `ANNOUNCEMENT_PUBLISHED`, `DOCUMENT_UPLOADED`, `DOCUMENT_ARCHIVED`, `MEETING_CREATED`, `MEETING_COMPLETED`, `ACTION_ITEM_CREATED`, `ACTION_ITEM_COMPLETED`, `LEADER_ASSIGNED`, `UNIT_CREATED`, `MEMBER_JOINED`, `MEMBER_REMOVED`, `DEVOTION_PUBLISHED`.

## API

`GET /ministries/:id/activity?type=&from=&to=`

## Access

`assertMinistryServicesAccess` — same visibility rules as other MF-3 services. Replaces MF-1 audit-log-only activity endpoint on the ministries controller.

## Consumers

- Dashboard `recentActivity`
- Web/mobile activity pages
- Global search (`ministryContent` bucket includes announcements, documents, meetings, action items)
