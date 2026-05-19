import { useMemo } from 'react'
import { useStore } from '../store'
import type { Routine, TimeOfDay } from '../types'

interface Props {
  onPlay: (routineId: string) => void
}

const DOW_MAP: Record<number, string> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday'
}

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  manual: 'Manual / Anytime'
}

const TIME_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'manual']

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  skincare: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  study: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  tasks: 'bg-green-500/20 text-green-300 border-green-500/30',
  custom: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
}

function getTodayRoutines(routines: Routine[]): Routine[] {
  const today = DOW_MAP[new Date().getDay()]
  return routines.filter(
    (r) => r.isSpecialOccasion || r.days.includes(today as Routine['days'][number])
  )
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

interface RoutineTileProps {
  routine: Routine
  done: boolean
  onPlay: (id: string) => void
}

function RoutineTile({ routine, done, onPlay }: RoutineTileProps) {
  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${
        done
          ? 'bg-slate-800/40 border-slate-700/50 opacity-60'
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                CATEGORY_COLORS[routine.category]
              }`}
            >
              {routine.category}
            </span>
            {routine.isSpecialOccasion && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold">
                ✨ Special
              </span>
            )}
            {routine.favorite && (
              <span className="text-yellow-400 text-xs">★</span>
            )}
            {routine.scheduledTime && (
              <span className="text-xs text-slate-400">@ {routine.scheduledTime}</span>
            )}
          </div>
          <h3
            className={`mt-2 font-semibold text-base ${
              done ? 'line-through text-slate-500' : 'text-white'
            }`}
          >
            {routine.name}
          </h3>
          <p className="text-slate-500 text-sm mt-0.5">
            {routine.steps.length} steps · {formatDuration(routine.estimatedDuration)}
          </p>
        </div>

        {done ? (
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xl flex-shrink-0">
            ✓
          </div>
        ) : (
          <button
            onClick={() => onPlay(routine.id)}
            className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 active:scale-95 transition-transform"
          >
            ▶
          </button>
        )}
      </div>
    </div>
  )
}

export default function TodayScreen({ onPlay }: Props) {
  const { routines, sessions } = useStore()

  const todayRoutines = useMemo(() => getTodayRoutines(routines), [routines])

  const todayDateStr = new Date().toDateString()
  const completedToday = sessions.filter(
    (s) => new Date(s.completedAt).toDateString() === todayDateStr
  )
  const completedIds = new Set(completedToday.map((s) => s.routineId))

  const progress =
    todayRoutines.length > 0
      ? Math.round((completedIds.size / todayRoutines.length) * 100)
      : 0

  // Favorites for today
  const todayFavorites = useMemo(
    () => todayRoutines.filter((r) => r.favorite),
    [todayRoutines]
  )

  // Grouped by time of day, favorites first within each group
  const grouped = useMemo(() => {
    const map: Partial<Record<TimeOfDay, Routine[]>> = {}
    for (const r of todayRoutines) {
      if (!map[r.timeOfDay]) map[r.timeOfDay] = []
      map[r.timeOfDay]!.push(r)
    }
    // Sort each group: favorites first
    for (const key of Object.keys(map) as TimeOfDay[]) {
      map[key] = [...map[key]!].sort((a, b) => {
        if (a.favorite && !b.favorite) return -1
        if (!a.favorite && b.favorite) return 1
        return 0
      })
    }
    return map
  }, [todayRoutines])

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <div className="pb-nav">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-800/50">
        <p className="text-slate-400 text-sm">{dayName}, {dateStr}</p>
        <h1 className="text-2xl font-bold text-white mt-1">Today</h1>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">
              {completedIds.size} of {todayRoutines.length} routines done
            </span>
            <span className="text-sm font-semibold text-indigo-400">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Routine groups */}
      <div className="px-4 mt-4 space-y-6">
        {todayRoutines.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">😴</p>
            <p className="text-lg font-medium">No routines today</p>
            <p className="text-sm mt-1">Add routines from the Routines tab</p>
          </div>
        ) : (
          <>
            {/* Pinned favorites section */}
            {todayFavorites.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                  ⭐ Favorites
                </h2>
                <div className="space-y-3">
                  {todayFavorites.map((routine) => (
                    <RoutineTile
                      key={`fav-${routine.id}`}
                      routine={routine}
                      done={completedIds.has(routine.id)}
                      onPlay={onPlay}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Time-of-day groups */}
            {TIME_ORDER.map((tod) => {
              const group = grouped[tod]
              if (!group?.length) return null
              return (
                <section key={tod}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                    {TIME_LABELS[tod]}
                  </h2>
                  <div className="space-y-3">
                    {group.map((routine) => (
                      <RoutineTile
                        key={routine.id}
                        routine={routine}
                        done={completedIds.has(routine.id)}
                        onPlay={onPlay}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
