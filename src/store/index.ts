import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Routine, CompletedSession, AppSettings } from '../types'
import { sampleRoutines } from '../data/sampleRoutines'
import { zustandStorage } from '../services/storage'

const DEFAULT_SETTINGS: AppSettings = {
  voice: {
    voiceURI: null,
    language: 'en-US',
    rate: 0.95,
    pitch: 1.0
  },
  music: {
    enabled: false,
    volume: 0.3,
    muted: false,
    perCategory: {
      gym: true,
      skincare: true,
      study: true,
      tasks: false,
      custom: false
    }
  },
  notificationsGranted: false
}

interface AppState {
  routines: Routine[]
  sessions: CompletedSession[]
  settings: AppSettings
  initialized: boolean
  addRoutine: (routine: Routine) => void
  updateRoutine: (routine: Routine) => void
  deleteRoutine: (id: string) => void
  duplicateRoutine: (id: string) => void
  addSession: (session: CompletedSession) => void
  toggleFavorite: (id: string) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  importData: (data: { routines: Routine[]; sessions: CompletedSession[]; settings?: AppSettings }) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      routines: [],
      sessions: [],
      settings: DEFAULT_SETTINGS,
      initialized: false,

      addRoutine: (routine) =>
        set((state) => ({ routines: [...state.routines, routine] })),

      updateRoutine: (routine) =>
        set((state) => ({
          routines: state.routines.map((r) => (r.id === routine.id ? routine : r))
        })),

      deleteRoutine: (id) =>
        set((state) => ({ routines: state.routines.filter((r) => r.id !== id) })),

      duplicateRoutine: (id) => {
        const routine = get().routines.find((r) => r.id === id)
        if (!routine) return
        const now = new Date().toISOString()
        const duplicate: Routine = {
          ...routine,
          id: `routine-${Date.now()}`,
          name: `${routine.name} (Copy)`,
          favorite: false,
          createdAt: now,
          updatedAt: now,
          steps: routine.steps.map((s) => ({ ...s, id: `step-${Date.now()}-${Math.random()}` }))
        }
        set((state) => ({ routines: [...state.routines, duplicate] }))
      },

      addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] })),

      toggleFavorite: (id) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, favorite: !r.favorite } : r
          )
        })),

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial }
        })),

      importData: (data) =>
        set(() => ({
          routines: data.routines,
          sessions: data.sessions,
          settings: data.settings ?? DEFAULT_SETTINGS
        }))
    }),
    {
      name: 'stepflow-storage',
      storage: zustandStorage,
      onRehydrateStorage: () => (state) => {
        if (state && !state.initialized) {
          state.routines = sampleRoutines
          state.initialized = true
        }
      }
    }
  )
)
