export type StepType = 'instruction' | 'timer' | 'reps' | 'check' | 'rest'
export type Category = 'gym' | 'skincare' | 'study' | 'tasks' | 'custom'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'manual'
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface Step {
  id: string
  type: StepType
  name: string
  duration?: number
  sets?: number
  reps?: number
  restDuration?: number
  description?: string
  voiceText?: string
  product?: string
  warning?: string
}

export interface Routine {
  id: string
  name: string
  category: Category
  timeOfDay: TimeOfDay
  days: DayOfWeek[]
  isSpecialOccasion?: boolean
  favorite?: boolean
  scheduledTime?: string        // HH:mm format
  notificationEnabled?: boolean
  steps: Step[]
  estimatedDuration: number
  createdAt: string
  updatedAt: string
}

export interface CompletedSession {
  id: string
  routineId: string
  routineName: string
  category: Category
  completedAt: string
  duration: number
  stepsCompleted: number
  totalSteps: number
}

export interface VoiceSettings {
  voiceURI: string | null
  language: string
  rate: number   // 0.5–2.0, default 0.95
  pitch: number  // 0.5–2.0, default 1.0
}

export interface MusicSettings {
  enabled: boolean
  volume: number  // 0–1, default 0.3
  muted: boolean
  perCategory: Partial<Record<Category, boolean>>
}

export interface AppSettings {
  voice: VoiceSettings
  music: MusicSettings
  notificationsGranted: boolean
}

export type Screen = 'today' | 'routines' | 'history' | 'settings'
