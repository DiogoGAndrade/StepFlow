import { v4 as uuidv4 } from 'uuid'
import type { Routine, Step, StepType, Category, TimeOfDay, DayOfWeek } from '../types'

export interface ParseResult {
  routine: Routine
  isDraft: boolean
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

// ---- Keyword lists ----
const GYM_KEYWORDS = [
  'gym', 'workout', 'exercise', 'push', 'pull', 'legs', 'hypertrophy',
  'sets', 'reps', 'bench', 'squat', 'deadlift', 'press', 'row', 'curl',
  'dip', 'lunge', 'warmup', 'warm-up', 'warm up', 'barbell', 'dumbbell'
]
const SKINCARE_KEYWORDS = [
  'skincare', 'cleanser', 'moisturizer', 'sunscreen', 'serum', 'toner',
  'retinol', 'eye cream', 'spf', 'face wash', 'exfoliant'
]
const STUDY_KEYWORDS = [
  'study', 'learn', 'focus', 'pomodoro', 'session', 'homework',
  'review', 'reading', 'read', 'flashcard', 'notes'
]
const TASKS_KEYWORDS = [
  'task', 'todo', 'to-do', 'chore', 'errands', 'shopping', 'clean', 'laundry'
]

const DAY_WORDS: Record<string, DayOfWeek> = {
  monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday',
  thursday: 'thursday', friday: 'friday', saturday: 'saturday', sunday: 'sunday'
}

// ---- Helpers ----
function makeStepId(): string {
  return `step-${Date.now()}-${Math.random()}`
}

function countKeywords(lower: string, keywords: string[]): number {
  return keywords.filter((kw) => lower.includes(kw)).length
}

/** Parse duration text like "10 minutes", "45 min", "2 hours", "30 sec", "30s", "1.5 hours" → seconds */
function parseDurationToSeconds(text: string): number | null {
  const patterns = [
    { re: /(\d+(?:\.\d+)?)\s*hours?/i, mult: 3600 },
    { re: /(\d+(?:\.\d+)?)\s*h\b/i, mult: 3600 },
    { re: /(\d+(?:\.\d+)?)\s*minutes?/i, mult: 60 },
    { re: /(\d+(?:\.\d+)?)\s*mins?/i, mult: 60 },
    { re: /(\d+(?:\.\d+)?)\s*seconds?/i, mult: 1 },
    { re: /(\d+(?:\.\d+)?)\s*secs?/i, mult: 1 },
    { re: /(\d+)\s*s\b/i, mult: 1 }
  ]
  for (const { re, mult } of patterns) {
    const m = text.match(re)
    if (m) return Math.round(parseFloat(m[1]) * mult)
  }
  return null
}

/** Parse sets×reps patterns: "3 sets of 12", "3x12", "3×12", "4 x 10" → {sets, reps} */
function parseSetsReps(text: string): { sets: number; reps: number } | null {
  const patterns = [
    /(\d+)\s*(?:sets?\s+of|x|×|X)\s*(\d+)/i,
    /(\d+)\s*x\s*(\d+)/i
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return { sets: parseInt(m[1]), reps: parseInt(m[2]) }
  }
  return null
}

/** Parse rest duration: "60 seconds rest", "1 minute rest", "90s rest" → seconds */
function parseRestDuration(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s|minutes?|mins?)\s*rest/i)
  if (!m) return null
  const val = parseFloat(m[1])
  const unit = m[0].toLowerCase()
  if (unit.includes('min')) return Math.round(val * 60)
  return Math.round(val)
}

/** Split text into exercise/item segments (by comma, semicolon, newline, "and") */
function splitItems(text: string): string[] {
  return text
    .split(/[,;\n]|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

/** Estimate routine duration in minutes using same formula as RoutineEditor */
function estimateDuration(steps: Step[]): number {
  let total = 0
  for (const s of steps) {
    if (s.type === 'timer' || s.type === 'rest') total += s.duration ?? 60
    else if (s.type === 'reps') total += ((s.sets ?? 1) * 30) + ((s.sets ?? 1) - 1) * (s.restDuration ?? 60)
    else total += 30
  }
  return Math.ceil(total / 60)
}

/** Generate a routine name from the first 6 words of input text */
function generateName(text: string): string {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
  if (words.length === 0) return 'My Routine'
  const name = words
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(' ')
  return name
}

// ---- Category-specific parsers ----

function parseGym(text: string, lower: string, warnings: string[]): Step[] {
  const steps: Step[] = []
  const globalRest = parseRestDuration(lower)

  // Add warmup step if mentioned
  if (/warm[\s-]?up/i.test(text)) {
    steps.push({
      id: makeStepId(),
      type: 'timer',
      name: 'Warm Up',
      duration: 300,
      description: 'Light cardio and dynamic stretching'
    })
  }

  // Split into exercise items
  const items = splitItems(text)
  const exerciseItems = items.filter((item) => {
    const l = item.toLowerCase()
    // Skip items that are just duration or rest descriptions
    return !/^(warmup|warm up|warm-up|rest|cool down|cooldown)$/i.test(l.trim())
  })

  let addedExercises = 0
  for (const item of exerciseItems) {
    const itemLower = item.toLowerCase()
    if (/warm[\s-]?up/i.test(item)) continue  // already added
    if (/cool[\s-]?down/i.test(item)) continue  // add at end

    const sr = parseSetsReps(item)
    const dur = parseDurationToSeconds(item)
    const restDur = globalRest ?? 60

    let step: Step

    if (sr) {
      // Reps-based exercise
      step = {
        id: makeStepId(),
        type: 'reps',
        name: item.replace(/\d+\s*(?:sets?\s+of|x|×|X)\s*\d+/i, '').replace(/\s+/g, ' ').trim() || item,
        sets: sr.sets,
        reps: sr.reps,
        restDuration: restDur
      }
    } else if (dur) {
      // Timed exercise
      step = {
        id: makeStepId(),
        type: 'timer',
        name: item.replace(/\d+(?:\.\d+)?\s*(?:hours?|h|minutes?|mins?|seconds?|secs?|s)\b/i, '').trim() || item,
        duration: dur
      }
    } else if (itemLower.length > 3) {
      // Plain instruction
      step = {
        id: makeStepId(),
        type: 'instruction',
        name: item
      }
    } else {
      continue
    }

    steps.push(step)
    addedExercises++

    // Add rest between exercises (not after last)
    if (addedExercises < exerciseItems.length - 1) {
      steps.push({
        id: makeStepId(),
        type: 'rest',
        name: 'Rest',
        duration: restDur
      })
    }
  }

  // Add cool down if mentioned
  if (/cool[\s-]?down/i.test(text)) {
    steps.push({
      id: makeStepId(),
      type: 'timer',
      name: 'Cool Down',
      duration: 300,
      description: 'Stretching and recovery'
    })
  }

  if (steps.length === 0) {
    warnings.push('Could not detect exercises. A placeholder step was added.')
    steps.push({
      id: makeStepId(),
      type: 'instruction',
      name: 'Workout (edit to add exercises)',
      description: text.slice(0, 120)
    })
  }

  return steps
}

function parseSkincare(text: string, lower: string, warnings: string[]): Step[] {
  const steps: Step[] = []

  // Try to extract product names from common patterns like "cleanser, toner, moisturizer, sunscreen"
  // or "with cleanser and toner and sunscreen"
  const items = splitItems(text)

  for (const item of items) {
    if (item.length < 3) continue
    const dur = parseDurationToSeconds(item)
    const cleanName = item
      .replace(/\d+(?:\.\d+)?\s*(?:hours?|h|minutes?|mins?|seconds?|secs?|s)\b/i, '')
      .trim()

    // Skip if the item itself is just a duration
    if (!cleanName || /^\d+$/.test(cleanName)) continue

    // Capitalize first letter
    const stepName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
    const step: Step = {
      id: makeStepId(),
      type: 'check',
      name: stepName,
      product: stepName
    }
    if (dur) step.duration = dur
    steps.push(step)
  }

  // Also check for skincare keywords directly
  const skincareProducts = ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'retinol', 'eye cream', 'spf', 'face wash']
  for (const product of skincareProducts) {
    if (lower.includes(product) && !steps.some((s) => s.name.toLowerCase().includes(product))) {
      steps.push({
        id: makeStepId(),
        type: 'check',
        name: product.charAt(0).toUpperCase() + product.slice(1),
        product: product.charAt(0).toUpperCase() + product.slice(1)
      })
    }
  }

  if (steps.length === 0) {
    warnings.push('Could not detect skincare products. A placeholder step was added.')
    steps.push({
      id: makeStepId(),
      type: 'check',
      name: 'Apply product',
      description: text.slice(0, 120)
    })
  }

  return steps
}

function parseStudy(text: string, lower: string, _warnings: string[]): Step[] {
  const steps: Step[] = []

  // Detect session count: "5 sessions", "3 sessions"
  const sessionCountMatch = lower.match(/(\d+)\s*sessions?/)
  const sessionCount = sessionCountMatch ? parseInt(sessionCountMatch[1]) : 2

  // Detect duration per session: "45 minutes", "25 min"
  const durMatch = lower.match(/(\d+)\s*(?:minutes?|mins?)/i)
  const sessionDur = durMatch ? parseInt(durMatch[1]) * 60 : 1500 // default 25 min (pomodoro)

  // Check if it's a pomodoro style
  const isPomodoro = /pomodoro/i.test(text)
  const sessionLabel = isPomodoro ? 'Pomodoro Session' : 'Study Session'
  const breakDur = isPomodoro ? 300 : 300  // 5 min break

  for (let i = 1; i <= sessionCount; i++) {
    steps.push({
      id: makeStepId(),
      type: 'timer',
      name: `${sessionLabel} ${i}`,
      duration: sessionDur,
      description: i === 1 ? 'Close all distractions. Focus.' : 'Stay focused.'
    })
    if (i < sessionCount) {
      steps.push({
        id: makeStepId(),
        type: 'rest',
        name: 'Short Break',
        duration: breakDur,
        description: 'Stand up, stretch, hydrate. No screens.'
      })
    }
  }

  return steps
}

function parseTasks(text: string, _lower: string, warnings: string[]): Step[] {
  const steps: Step[] = []
  const items = splitItems(text)

  for (const item of items) {
    if (item.length < 3) continue
    const cleanName = item.charAt(0).toUpperCase() + item.slice(1)
    steps.push({
      id: makeStepId(),
      type: 'instruction',
      name: cleanName
    })
  }

  if (steps.length === 0) {
    warnings.push('Could not detect tasks. A placeholder step was added.')
    steps.push({
      id: makeStepId(),
      type: 'instruction',
      name: 'Complete task',
      description: text.slice(0, 120)
    })
  }

  return steps
}

// ---- Main export ----

export function parseTextToRoutine(text: string): ParseResult {
  const warnings: string[] = []
  const lower = text.toLowerCase()

  // Detect category
  const gymScore = countKeywords(lower, GYM_KEYWORDS)
  const skincareScore = countKeywords(lower, SKINCARE_KEYWORDS)
  const studyScore = countKeywords(lower, STUDY_KEYWORDS)
  const tasksScore = countKeywords(lower, TASKS_KEYWORDS)

  const scores = { gym: gymScore, skincare: skincareScore, study: studyScore, tasks: tasksScore }
  const maxScore = Math.max(...Object.values(scores))
  let category: Category = 'custom'
  if (maxScore > 0) {
    category = (Object.entries(scores).find(([, v]) => v === maxScore)?.[0] ?? 'custom') as Category
  }

  // Detect timeOfDay
  let timeOfDay: TimeOfDay = 'manual'
  if (/morning|am\b|wake\s*up/i.test(text)) timeOfDay = 'morning'
  else if (/afternoon|noon|lunch/i.test(text)) timeOfDay = 'afternoon'
  else if (/evening|night|pm\b|bedtime/i.test(text)) timeOfDay = 'evening'

  // Detect weekdays
  const days: DayOfWeek[] = []
  if (/every\s*day|daily|everyday/i.test(lower)) {
    days.push('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  } else if (/weekday/i.test(lower)) {
    days.push('monday', 'tuesday', 'wednesday', 'thursday', 'friday')
  } else {
    for (const [word, day] of Object.entries(DAY_WORDS)) {
      if (lower.includes(word)) days.push(day)
    }
  }

  // Parse steps by category
  let steps: Step[] = []
  switch (category) {
    case 'gym':
      steps = parseGym(text, lower, warnings)
      break
    case 'skincare':
      steps = parseSkincare(text, lower, warnings)
      break
    case 'study':
      steps = parseStudy(text, lower, warnings)
      break
    case 'tasks':
    case 'custom':
    default:
      steps = parseTasks(text, lower, warnings)
      break
  }

  // Confidence assessment
  let confidence: 'high' | 'medium' | 'low'
  if (maxScore >= 3 && steps.length >= 2) confidence = 'high'
  else if (maxScore >= 1 && steps.length >= 1) confidence = 'medium'
  else confidence = 'low'

  const isDraft = confidence === 'low'

  const now = new Date().toISOString()
  const routine: Routine = {
    id: `routine-${Date.now()}`,
    name: generateName(text),
    category,
    timeOfDay,
    days,
    steps,
    estimatedDuration: estimateDuration(steps),
    createdAt: now,
    updatedAt: now
  }

  return { routine, isDraft, confidence, warnings }
}
