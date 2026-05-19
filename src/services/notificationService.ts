import type { Routine } from '../types'

/** Check if the Notification API is available in this browser */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Request notification permission from the browser */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied'
  const permission = await Notification.requestPermission()
  return permission
}

/** Schedule a routine reminder notification for a specific future time today */
export function scheduleRoutineReminder(routine: Routine): void {
  if (!routine.notificationEnabled || !routine.scheduledTime) return
  if (!isNotificationSupported()) return
  if (Notification.permission !== 'granted') return

  const [hours, minutes] = routine.scheduledTime.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(hours, minutes, 0, 0)

  // If the time is in the past today, skip
  if (target <= now) return

  const delay = target.getTime() - now.getTime()
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(`StepFlow: ${routine.name}`, {
        body: `Time for your routine! ${routine.steps.length} steps · ~${routine.estimatedDuration}m`,
        icon: '/StepFlow/icons/icon-192.svg',
        tag: `routine-${routine.id}`
      })
    }
  }, delay)
}

// In-memory watcher interval reference
let watcherInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start a watcher that checks every minute if any notification-enabled routine
 * has a scheduledTime matching the current HH:mm and fires a notification.
 * Returns a cleanup function to stop the watcher.
 */
export function startNotificationWatcher(routines: Routine[]): () => void {
  // Stop any existing watcher
  if (watcherInterval !== null) {
    clearInterval(watcherInterval)
    watcherInterval = null
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return () => {}
  }

  // Track which routines have been notified this minute to avoid double-firing
  let lastFiredMinute = ''

  const check = () => {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const currentTime = `${hh}:${mm}`

    // Only fire once per minute
    if (currentTime === lastFiredMinute) return
    lastFiredMinute = currentTime

    for (const routine of routines) {
      if (!routine.notificationEnabled) continue
      if (!routine.scheduledTime) continue
      if (routine.scheduledTime !== currentTime) continue
      if (Notification.permission !== 'granted') continue

      new Notification(`StepFlow: ${routine.name}`, {
        body: `Time for your routine! ${routine.steps.length} steps · ~${routine.estimatedDuration}m`,
        icon: '/StepFlow/icons/icon-192.svg',
        tag: `routine-${routine.id}`
      })
    }
  }

  // Run immediately, then every 30 seconds for responsiveness
  check()
  watcherInterval = setInterval(check, 30_000)

  return () => {
    if (watcherInterval !== null) {
      clearInterval(watcherInterval)
      watcherInterval = null
    }
  }
}

/** Clear all in-memory reminder timers (watcher) */
export function clearAllReminders(): void {
  if (watcherInterval !== null) {
    clearInterval(watcherInterval)
    watcherInterval = null
  }
}
