import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Routine, CompletedSession } from '../types'
import { sampleRoutines } from '../data/sampleRoutines'
import { zustandStorage } from '../services/storage'

interface AppState {
  routines: Routine[]
  sessions: CompletedSession[]
  initialized: boolean
  addRoutine: (routine: Routine) => void
  updateRoutine: (routine: Routine) => void
  deleteRoutine: (id: string) => void
  duplicateRoutine: (id: string) => void
  addSession: (session: CompletedSession) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      routines: [],
      sessions: [],
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
          createdAt: now,
          updatedAt: now,
          steps: routine.steps.map((s) => ({ ...s, id: `step-${Date.now()}-${Math.random()}` }))
        }
        set((state) => ({ routines: [...state.routines, duplicate] }))
      },

      addSession: (session) =>
        set((state) => ({ sessions: [session, ...state.sessions] }))
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
