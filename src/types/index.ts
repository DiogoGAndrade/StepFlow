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

export type Screen = 'today' | 'routines' | 'history'
