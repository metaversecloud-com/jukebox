<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Jukebox

## Introduction

Jukebox is a shared-music Topia app that turns a single dropped asset into a curated, in-world player. Admins search YouTube and build a per-asset **catalog** of approved tracks. Visitors who interact with the asset browse that catalog and add tracks to a live **queue**. When one song ends the app advances to the next; when the queue is empty and someone adds the first track, playback starts immediately.

The app runs in two modes: **Karaoke** (video + audio) or **Jukebox** (audio only). Admins pick the mode, the display name, and a custom banner image from the in-app Admin tab. Live state is fanned out to every open drawer over Redis-backed Server-Sent Events so the "Now Playing" and queue lists stay in sync across visitors.

## Key Features

### Canvas element & interaction

- **The jukebox asset** — any Topia dropped asset you attach the Interactive URL to. Clicking it opens the drawer. The catalog, queue, playback state, and settings all live on this asset's data object, so each dropped asset is its own independent jukebox.
- **Now-playing media** — the same asset streams the currently playing YouTube track via `updateMediaType` with `syncUserMedia: true`, so everyone in audio range hears (and optionally sees) the same thing in sync.
- **`musicNote_float` particle** — fires above the asset each time a new track starts playing.

### Drawer content

- **Now Playing + Next Up** — Home page shows the current track and the ordered queue. Admins can select queued tracks and remove them or press Skip to Next Song.
- **Add a Song** — visitors browse or type-filter the catalog, select one or more tracks, and add them to the queue.
- **Admin tab** — Admins get an extra tab (see below) that adds catalog curation and settings.
- **Live updates** — the drawer subscribes to an SSE stream and reacts to `nowPlaying`, `addedToCatalog`, `removedFromCatalog`, `addedToQueue`, and `removedFromQueue` events without a manual refresh.

### Admin features

- **Access** — visit the drawer as an admin (Topia world admin) and select the Admin tab. Changes affect only this jukebox asset.
- **Settings** — pick the mode (`jukebox` / `karaoke`), override the display name, and set a custom banner image URL. Switching mode calls `updateMediaType` immediately so the current track re-loads with the right `isVideo` flag.
- **YouTube search** — search directly against the YouTube Data API from the drawer (25 results per page, `safeSearch` configurable via env). Duration is fetched per-video and stored in the catalog so it can be shown without another API call.
- **Catalog curation** — add search results to the catalog, or remove tracks from the catalog. Removed tracks are also purged from the queue. The catalog is re-validated against YouTube on every admin load — tracks that YouTube has since removed are flagged with `exists: false`.
- **Queue control** — remove queued tracks or skip to the next available one. Removing the currently playing track automatically advances playback.

### Playback flow

- Adding to an empty queue when nothing is playing starts the first track immediately (via `updateMediaType`) and fires `plays` analytics.
- When a track ends, the asset's built-in media completion hits the public `POST /webhook/next` route, which advances to the next available track. Tracks that YouTube has removed are skipped over.
- If the queue empties, `updateMediaType({ mediaType: NONE })` clears playback.

## Required Assets with Unique Names

Jukebox operates on **the specific dropped asset the visitor clicks** — its `assetId` is read from the iframe credentials. There is no unique-name lookup in the codebase.

| Unique Name | Required | Description                                                                                                 |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| _none_      | –        | The jukebox is bound to the interactive asset itself (`credentials.assetId`); no fixed unique name is used. |

> **Note:** any dropped asset with the Interactive URL and Player Session Credentials enabled can act as a jukebox. State is per-asset, so dropping two assets gives you two independent jukeboxes.

## Technical Architecture

### Data Objects

#### Dropped Asset (the jukebox itself)

The primary and only store. Attached to the dropped asset the visitor clicks and deleted with it. Initialized lazily by `initializeJukebox` on first fetch.

```ts
{
  catalog: Video[];           // Admin-curated tracks (see Video shape below)
  queue: string[];            // Ordered list of videoIds pulled from catalog
  nowPlaying: string;         // videoId currently playing, or "-1" when stopped
  settings: {
    mode: "jukebox" | "karaoke";
    name: string;             // Display name override; empty falls back to mode default
    imageUrl: string;         // Banner image override; empty falls back to jukebox_bg.png
  };
}
```

The `Video` shape stored on `catalog`:

```ts
{
  id: { videoId: string };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: { high: { url: string } };
  };
  duration: number;           // Milliseconds, parsed from YouTube ISO 8601
  exists?: boolean;           // Populated only in admin GET /jukebox responses
}
```

#### World / Visitor / User

Not used. Jukebox does not read from or write to world, visitor, or user data objects.

### Real-time Transport

Live sync uses Redis pub/sub fanning out to browser SSE.

| Channel                      | Direction               | Payload                                                                                                                                               |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `${INTERACTIVE_KEY}_JUKEBOX` | Server → Server (Redis) | `{ event: "nowPlaying", videoId, nextUpId }` or `{ event: "mediaAction", kind, videos, assetId, visitorId, interactiveNonce }`                        |
| `GET /api/sse`               | Server → Client         | Fan-out of the above, filtered so a client does not receive its own `mediaAction` echo. Client sends heartbeats to `POST /api/heartbeat` every 5 min. |

## API Endpoints

All routes mount under `/api` unless noted. Interactive query params (`assetId`, `interactiveNonce`, `interactivePublicKey`, `urlSlug`, `visitorId`, `profileId`) are auto-attached by the client-side Axios interceptor.

| Method | Route                             | Auth  | Description                                                                                                                                                                                    |
| ------ | --------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`                               | –     | Hello ping.                                                                                                                                                                                    |
| GET    | `/system/health`                  | –     | Server version, start date, and env-var SET/NOT-SET status.                                                                                                                                    |
| GET    | `/system/interactive-credentials` | –     | Validates the visitor's session credentials against `INTERACTIVE_KEY`.                                                                                                                         |
| GET    | `/is-admin`                       | –     | `{ isAdmin: boolean }` for the current visitor.                                                                                                                                                |
| GET    | `/jukebox`                        | –     | Returns the data object. For admins, each catalog entry is annotated with `exists` after a YouTube existence check. Fires `views` analytics.                                                   |
| GET    | `/sse`                            | –     | Opens the Server-Sent Events stream. Requires `interactiveNonce` in the query.                                                                                                                 |
| POST   | `/heartbeat`                      | –     | Keeps the SSE connection alive (client pings every 5 min; server prunes stale connections after 15 min).                                                                                       |
| POST   | `/add-media`                      | mixed | Body `{ videos, type }`. `type: "catalog"` is admin-only and takes `Video[]`. `type: "queue"` takes `string[]` of videoIds. If queue was empty and nothing is playing, starts the first track. |
| POST   | `/remove-media`                   | admin | Body `{ videoIds, type }`. `type: "catalog"` also removes matching entries from the queue. If the currently playing track is removed, advances playback.                                       |
| POST   | `/next`                           | admin | Skips to the next available track. Falls back to `mediaType: NONE` if the queue is empty.                                                                                                      |
| POST   | `/search`                         | admin | Body `{ q, nextPageToken }`. Proxies YouTube Data API v3 search with per-video duration lookup.                                                                                                |
| POST   | `/settings`                       | admin | Body `Partial<{ mode, name, imageUrl }>`. Validates `mode` against `"jukebox" \| "karaoke"`; a mode change also re-invokes `updateMediaType` on the current track.                             |

### Webhook

Mounted separately at `/webhook`.

| Method | Route           | Auth | Description                                                                                                                            |
| ------ | --------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/webhook/next` | –    | Called by the Topia asset when the current media completes. Same handler as `POST /api/next`; reads credentials from the request body. |

All mutating routes use `updateDataObject({..., lock: { lockId, releaseLock: false } })` with a rounded-timestamp `lockId` to prevent duplicate playback advances or concurrent catalog edits — collisions return HTTP 409.

## Analytics

Fired via the SDK's `updateDataObject({}, { analytics })` mechanism on the jukebox dropped asset.

| Event             | Fired when                                                         | Where                                                 | Unique key                |
| ----------------- | ------------------------------------------------------------------ | ----------------------------------------------------- | ------------------------- |
| `views`           | Any visitor opens the drawer.                                      | `GET /jukebox`                                        | `profileId` (per profile) |
| `addsToCatalog`   | Admin adds tracks to the catalog.                                  | `POST /add-media` (`type: "catalog"`)                 | `urlSlug` (per world)     |
| `addsToQueue`     | Visitor adds tracks to the queue.                                  | `POST /add-media` (`type: "queue"`)                   | `profileId` (per profile) |
| `plays`           | A track starts playing (first-track-on-empty-queue, or on `next`). | `POST /add-media`, `POST /next`, `POST /webhook/next` | `urlSlug` (per world)     |
| `settingsUpdates` | Admin saves settings.                                              | `POST /settings`                                      | `urlSlug` (per world)     |

There are no per-mode variants and no external analytics sinks (no Google Sheets, no BigQuery).

## Environment Variables

Create a `.env` file in the root directory. See `.env-example` for a template.

| Variable             | Description                                                                          | Required |
| -------------------- | ------------------------------------------------------------------------------------ | -------- |
| `INTERACTIVE_KEY`    | Topia interactive app key. Enforced at startup.                                      | Yes      |
| `INTERACTIVE_SECRET` | Topia interactive app secret. Enforced at startup.                                   | Yes      |
| `GOOGLE_API_KEY`     | YouTube Data API v3 key. Required for `POST /search` and catalog existence checks.   | Yes      |
| `INSTANCE_DOMAIN`    | Topia API domain. Defaults to `api.topia.io`. Use `api-stage.topia.io` for staging.  | No       |
| `INSTANCE_PROTOCOL`  | `https` or `http`. Defaults to `https`.                                              | No       |
| `REDIS_URL`          | Redis URL for the pub/sub bus that powers SSE fan-out.                               | Yes      |
| `REDIS_CLUSTER_MODE` | `"true"` to use `redis.createCluster`, otherwise a single client is used.            | No       |
| `SAFE_SEARCH`        | Passed through to YouTube search — `"moderate"`, `"strict"`, or `"none"`.            | No       |
| `AUDIO_ONLY`         | If truthy, `DEFAULT_SETTINGS.mode` defaults to `"jukebox"` instead of `"karaoke"`.   | No       |
| `PORT`               | Server port. Defaults to `3000`.                                                     | No       |
| `NODE_ENV`           | Node environment. `development` enables verbose Redis/SSE logs and CORS for `:3001`. | No       |
| `API_KEY`            | Surfaced in `/system/health`. Not required by the current SDK init.                  | No       |

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- Click your account image (top-left in-world) → Integrations.
- Create a key pair at [https://topia.io/t/dashboard/integrations](https://topia.io/t/dashboard/integrations).
- Add `INTERACTIVE_KEY` and `INTERACTIVE_SECRET` to your `.env`.
- Enable **Add Player Session Credentials to Asset Interactions** for your developer public key so the drawer receives session credentials.

## Getting Started

```bash
# from the app root
npm install
cd client && npm install && cd ..

# create a .env at the app root (see Environment Variables above)
cp .env-example .env

# run the dev server (concurrently runs server + client via Vite)
npm run dev
```

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

### App-specific notes

- **Media source:** YouTube only. `SearchVideos` calls YouTube Data API v3 with `videoEmbeddable: "true"`; playback links resolve to `https://www.youtube.com/watch?v=<videoId>` and are handed to `DroppedAsset.updateMediaType` with `syncUserMedia: true` so every listener stays in sync.
- **Track advance on end:** Topia's asset media-completion callback hits `POST /webhook/next`. That handler reads credentials from `req.body`, not query, so the webhook config on the asset must be set to send them there.
- **Skip-unavailable logic:** `getAvailableVideos` batches videoIds into groups of 50 and checks YouTube's `videos.list` before advancing. If none remain, playback stops.
- **Locks & idempotency:** every mutating write uses `updateDataObject(..., { lock: { lockId, releaseLock: false } })` with `lockId` rounded to a coarse timestamp bucket. Concurrent conflicting writes return 409.
- **SSE lifecycle:** the client opens `/api/sse` on load, receives `nowPlaying` / `mediaAction` events, and posts `/heartbeat` every 5 min. The server sweeps connections older than 15 min without a heartbeat.
- **Mode default:** if `settings.mode` is unset on the asset, playback falls back to `AUDIO_ONLY ? "jukebox" : "karaoke"` at `updateMediaType` time.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/jukebox-dev), [Prod](https://topia.io/jukebox-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/Jukebox-3ef560632746430e93604e681e697306?v=71f6c3828d3b4f33960326f9bde24781)
