import { useMemo } from 'react'
import { useStore } from '../store'
import type { CompletedSession } from '../types'

const CATEGORY_EMOJIS: Record<string, string> = {
  gym: '💪', skincare: '✨', study: '📚', tasks: '✅', custom: '⭐'
}

function formatDuration(secs: number) {
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function getWeekStart(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export default function HistoryScreen() {
  const { sessions, routines } = useStore()

  const stats = useMemo(() => {
    if (sessions.length === 0) return null

    const now = new Date()
    const weekStart = getWeekStart(now)
    const weekSessions = sessions.filter((s) => new Date(s.completedAt) >= weekStart)

    // Count unique days this week with at least 1 session
    const daysThisWeek = 7
    const activeDays = new Set(
      weekSessions.map((s) => new Date(s.completedAt).toDateString())
    ).size
    const weeklyRate = Math.round((activeDays / daysThisWeek) * 100)

    // Streak: consecutive days ending today with at least 1 session
    let streak = 0
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    while (true) {
      const ds = d.toDateString()
      if (sessions.some((s) => new Date(s.completedAt).toDateString() === ds)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else {
        break
      }
    }

    // Top category
    const catCount: Record<string, number> = {}
    for (const s of sessions) {
      catCount[s.category] = (catCount[s.category] ?? 0) + 1
    }
    const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return { weeklyRate, streak, topCategory, activeDays }
  }, [sessions])

  const today = new Date().toDateString()
  const todayRoutines = routines.filter((r) => {
    const dow = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
    return !r.isSpecialOccasion && r.days.includes(dow as never)
  })
  const completedTodayIds = new Set(
    sessions.filter((s) => new Date(s.completedAt).toDateString() === today).map((s) => s.routineId)
  )
  const missedToday = todayRoutines.filter((r) => !completedTodayIds.has(r.id))

  // Group sessions by date
  const grouped = useMemo(() => {
    const map: Map<string, CompletedSession[]> = new Map()
    for (const s of sessions) {
      const key = new Date(s.completedAt).toDateString()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return [...map.entries()].sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
  }, [sessions])

  return (
    <div className="pb-nav">
      <div className="px-4 pt-12 pb-4 bg-slate-800/50">
        <h1 className="text-2xl font-bold text-white">History</h1>
      </div>

      <div className="px-4 mt-4 space-y-5">
        {/* Stats cards */}
        {stats ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <p className="text-slate-400 text-xs">Weekly Rate</p>
              <p className="text-3xl font-bold text-indigo-400 mt-1">{stats.weeklyRate}%</p>
              <p className="text-slate-500 text-xs mt-1">{stats.activeDays}/7 days</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <p className="text-slate-400 text-xs">Current Streak</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">
                {stats.streak} 🔥
              </p>
              <p className="text-slate-500 text-xs mt-1">
                {stats.streak === 1 ? 'day' : 'days'}
              </p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <p className="text-slate-400 text-xs">Top Category</p>
              <p className="text-3xl mt-1">
                {CATEGORY_EMOJIS[stats.topCategory ?? ''] ?? '❓'}
              </p>
              <p className="text-slate-300 text-sm mt-1 capitalize">{stats.topCategory ?? '—'}</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <p className="text-slate-400 text-xs">Total Sessions</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{sessions.length}</p>
              <p className="text-slate-500 text-xs mt-1">all time</p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
            <p className="text-4xl mb-2">📊</p>
            <p className="text-slate-400">No sessions yet</p>
            <p className="text-slate-500 text-sm mt-1">Complete routines to see stats</p>
          </div>
        )}

        {/* Missed today */}
        {missedToday.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Missed Today
            </h2>
            <div className="space-y-2">
              {missedToday.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20"
                >
                  <span className="text-red-400">{CATEGORY_EMOJIS[r.category]}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{r.name}</p>
                    <p className="text-red-400 text-xs">{r.timeOfDay}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session log */}
        {grouped.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
              Session Log
            </h2>
            <div className="space-y-4">
              {grouped.map(([dateKey, daySessions]) => (
                <div key={dateKey}>
                  <p className="text-xs text-slate-500 mb-2">{formatDate(daySessions[0].completedAt)}</p>
                  <div className="space-y-2">
                    {daySessions.map((s) => (
                      <div
                        key={s.id}
                        className="bg-slate-800 rounded-xl px-4 py-3 border border-slate-700 flex items-center gap-3"
                      >
                        <span className="text-xl">{CATEGORY_EMOJIS[s.category]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{s.routineName}</p>
                          <p className="text-slate-500 text-xs">
                            {s.stepsCompleted}/{s.totalSteps} steps · {formatDuration(s.duration)}
                          </p>
                        </div>
                        <p className="text-slate-500 text-xs flex-shrink-0">{formatTime(s.completedAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
