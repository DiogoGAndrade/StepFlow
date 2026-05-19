# StepFlow — Product Roadmap

## Current Architecture

StepFlow is a **frontend-only Progressive Web App (PWA)** built with:

- **Vite + React + TypeScript** — fast builds, type-safe components
- **Tailwind CSS** — utility-first styling, dark theme only
- **Zustand + persist** — all state in `localStorage` via a custom storage adapter (`src/services/storage.ts`)
- **Vite PWA Plugin** — service worker, offline support, installable
- **Deployed to GitHub Pages** at `/StepFlow/`
- **No backend, no authentication, no paid APIs**

All user data (routines, sessions, settings) is stored locally in the browser's `localStorage`.

---

## Feature Status

### Phase 1 — MVP (current)

| Feature | Status |
|---------|--------|
| Routine builder with step editor | Done |
| Step types: instruction, timer, reps, check, rest | Done |
| Routine player with circular timer and audio beeps | Done |
| Text-to-speech voice announcements | Done |
| Voice settings (voice, rate, pitch) | Done |
| Background music player (local MP3 files) | Done (files not included) |
| Favorites / pinning | Done |
| Scheduled time per routine (HH:mm) | Done |
| In-browser notification watcher | Done |
| Today view with progress bar | Done |
| History / session log | Done |
| Import / Export JSON backup | Done |
| Local text-to-routine parser | Done |
| Settings screen | Done |
| PWA install + offline | Done |

---

## Local Text-to-Routine Parser (now)

The parser (`src/services/textParser.ts`) is a **deterministic, rule-based** engine:

- Detects category from keyword scoring (gym, skincare, study, tasks, custom)
- Detects time of day and weekdays from natural language
- Splits exercises/products/tasks by comma, newline, "and"
- Parses sets/reps: `3x12`, `3 sets of 12`, `3×12`
- Parses durations: `10 minutes`, `45 min`, `2 hours`, `30 sec`
- Returns a confidence level (high/medium/low) and draft flag
- No API calls, no internet required

### Limitations

- Cannot handle ambiguous or complex natural language
- No understanding of context or intent beyond keyword matching
- Multi-day or multi-week programs are collapsed into one routine

---

## Planned: AI Routine Generation (future)

When a backend is available, the text-to-routine flow will be enhanced:

1. User types a prompt in the TextToRoutineModal
2. Frontend sends prompt to a **serverless function** (Cloudflare Worker or Appwrite Function)
3. The function calls a **language model API** (e.g. Claude, GPT-4o) with a structured prompt
4. The API returns a typed JSON routine object
5. Frontend validates and previews the result before saving

The local rule-based parser will remain as a fallback when offline.

---

## Planned: Appwrite Migration (future)

### Goals

- User authentication (email/password, OAuth)
- Cloud storage for routines and sessions (Appwrite Database)
- Multi-device sync via Appwrite Realtime
- Per-user settings stored in the cloud

### Migration path

1. Keep existing `localStorage` as primary store
2. Add Appwrite SDK alongside existing Zustand store
3. On login: sync local data to cloud, then use Appwrite as source of truth
4. Offline-first: queue mutations locally, sync when online
5. Conflict resolution: last-write-wins on `updatedAt`

---

## Planned: Reliable Push Notifications (future)

Current notification support uses an **in-browser interval watcher** (`src/services/notificationService.ts`). This works only while the app is open.

For reliable background push notifications:

1. Register a **Web Push** subscription in the browser
2. Store the subscription endpoint in Appwrite Database
3. Use an **Appwrite Function** triggered on a schedule (or via Appwrite Messaging)
4. The function checks which routines are due and sends push notifications via **VAPID / Web Push Protocol**
5. The PWA service worker handles the push event and shows the notification even when the app is closed

---

## Planned: Multi-Device Sync (future)

Once Appwrite auth and database are in place:

- Routines and sessions sync automatically when online
- Conflict resolution based on `updatedAt` timestamps
- Offline queue stored in `localStorage`, flushed on reconnect
- Real-time updates via Appwrite Realtime subscriptions

---

## Planned: Background Music (future)

Current music support requires users to place MP3 files in `public/audio/`. Future plans:

- Curated royalty-free tracks bundled with the app or hosted on a CDN
- Per-routine music selection in the routine editor
- Volume fade-in/fade-out between steps

---

## Technical Debt / Cleanup

- Add unit tests for text parser
- Add E2E tests for routine player flow
- Migrate from emoji icons to a proper icon library (Lucide, Heroicons)
- Add proper error boundaries around screens
- Improve accessibility (ARIA labels, keyboard navigation)
