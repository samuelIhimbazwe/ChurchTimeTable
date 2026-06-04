# Broadcast Center

## Model: `ChurchBroadcast`

- `title`, `description`, `youtubeUrl`, `thumbnail`
- `broadcastType`: LIVE_SERVICE, RECORDED_SERVICE, SERMON, SPECIAL_EVENT, OTHER
- `startAt`, `endAt`, `isLive`

## API

- `GET /church/broadcasts` — all published broadcasts (authenticated members)
- `GET /church/broadcasts/live` — `isLive: true` only
- `POST /church/broadcasts` — leaders with `member.manage` or announcement manage

Web: `/broadcasts`, `/live`.
