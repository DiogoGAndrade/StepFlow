# Future Appwrite Migration Guide

This document explains how to migrate StepFlow from localStorage to Appwrite
(Auth + Databases) without rewriting the UI layer.

## Current architecture

```
UI components
     │
     ▼
Zustand store (src/store/index.ts)
     │  persist middleware
     ▼
src/services/storage.ts  ◄── single swap point
     │  localStorageAdapter
     ▼
localStorage (browser)
```

All persistence flows through `zustandStorage` exported from
`src/services/storage.ts`. The UI and the store never touch `localStorage`
directly.

---

## Step 1 — Add Appwrite SDK

```bash
npm install appwrite
```

---

## Step 2 — Set up Appwrite project

1. Create a project in the Appwrite console.
2. Enable **Email/Password** authentication under Auth → Settings.
3. Create a database, then a collection called `stepflow_state` with a single
   attribute `data` (string, large).
4. Set collection permissions so that users can read/write only their own
   documents (role: `user`).
5. Copy your **Project ID**, **Endpoint**, **Database ID**, and
   **Collection ID** into environment variables:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
VITE_APPWRITE_DATABASE_ID=your-database-id
VITE_APPWRITE_COLLECTION_ID=stepflow_state
```

---

## Step 3 — Create the Appwrite client (src/services/appwrite.ts)

```typescript
import { Client, Account, Databases } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

export const account = new Account(client)
export const databases = new Databases(client)
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
export const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID
```

---

## Step 4 — Create the Appwrite storage adapter (src/services/storage.ts)

Replace `localStorageAdapter` with an adapter that reads and writes the
serialised Zustand state to an Appwrite document keyed by the current user's
ID:

```typescript
import { account, databases, DATABASE_ID, COLLECTION_ID } from './appwrite'
import { ID } from 'appwrite'
import { createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

async function getUserId(): Promise<string> {
  const user = await account.get()
  return user.$id
}

export const appwriteAdapter: StateStorage = {
  getItem: async (_name) => {
    const userId = await getUserId()
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, userId)
      return doc.data as string
    } catch {
      return null
    }
  },

  setItem: async (_name, value) => {
    const userId = await getUserId()
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, userId, { data: value })
    } catch {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, userId, { data: value })
    }
  },

  removeItem: async (_name) => {
    const userId = await getUserId()
    await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, userId)
  },
}

export const zustandStorage = createJSONStorage(() => appwriteAdapter)
```

No other file needs to change — the store and all UI components are unaffected.

---

## Step 5 — Add an Auth UI

Create `src/screens/AuthScreen.tsx` with email/password sign-up and login
forms calling `account.create()` and `account.createEmailPasswordSession()`.

Gate `<App />` in `src/main.tsx`:

```tsx
import { account } from './services/appwrite'

async function checkSession() {
  try {
    await account.get()
    return true
  } catch {
    return false
  }
}

const isLoggedIn = await checkSession()
// render AuthScreen or App based on isLoggedIn
```

---

## Step 6 — One-time data migration for existing users

On first login after the migration ships, copy the user's localStorage data to
Appwrite:

```typescript
const LOCAL_KEY = 'stepflow-storage'

async function migrateLocalToAppwrite() {
  const raw = localStorage.getItem(LOCAL_KEY)
  if (!raw) return
  await appwriteAdapter.setItem(LOCAL_KEY, raw)
  localStorage.removeItem(LOCAL_KEY)
}
```

Call this once right after the user's first successful login.

---

## What does NOT change

| Layer | Status |
|---|---|
| `src/types/` | Unchanged — Routine, Step, CompletedSession shapes stay the same |
| `src/store/index.ts` | Unchanged — Zustand actions and selectors stay the same |
| All screen and component files | Unchanged — they read/write the store, not storage |
| `vite.config.ts` | Unchanged — base path and PWA config stay the same |

The migration is entirely contained in `src/services/storage.ts` and a new
`src/services/appwrite.ts`, plus an optional `AuthScreen`.
