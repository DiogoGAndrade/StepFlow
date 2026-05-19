import { createJSONStorage } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

// Swap localStorageAdapter for an Appwrite/remote adapter when migrating backends.
// See docs/FUTURE_APPWRITE_MIGRATION.md for the migration guide.
export const localStorageAdapter: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
}

export const zustandStorage = createJSONStorage(() => localStorageAdapter)
