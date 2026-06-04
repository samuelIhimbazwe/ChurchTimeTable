# Choir Music Library

## Overview

Central song repository with lyrics, assets, usage history, favorites, and analytics.

## Permissions

| Permission | Capability |
| --- | --- |
| `choir.music.view` | Browse songs, favorites, analytics |
| `choir.music.manage` | Create/update songs and assets |

## API (`/api/v1/choir/music`)

- `GET /songs` — list (`q`, `categoryId`, `language`)
- `GET /songs/:id` — detail, assets, usage, `isFavorite`
- `POST /songs` / `PATCH /songs/:id` — manage catalog
- `POST /songs/:id/assets` — attach PDF/audio/video/sheet music URLs
- `POST /songs/:id/favorite` — toggle personal favorite
- `GET /favorites` — current member favorites
- `GET /analytics` — totals, recent, most used, category/language distribution

## Search

Global search includes songs when `choir.music.view` or `choir.music.manage` is granted.

## Web & Mobile

- Web: `/dashboard/music`, `/dashboard/music/[id]`
- Mobile: `/music` library + song detail
