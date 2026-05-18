import type { Routine } from '../../types'

interface Props {
  routine: Routine
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onPlay: (id: string) => void
  onExport: (id: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  gym: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  skincare: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  study: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  tasks: 'bg-green-500/20 text-green-300 border-green-500/30',
  custom: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
}

const DAY_SHORT: Record<string, string> = {
  monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th',
  friday: 'Fr', saturday: 'Sa', sunday: 'Su'
}

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function RoutineCard({ routine, onEdit, onDuplicate, onDelete, onPlay, onExport }: Props) {
  const isAllDays = ALL_DAYS.every((d) => routine.days.includes(d as Routine['days'][number]))

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                CATEGORY_COLORS[routine.category]
              }`}
            >
              {routine.category}
            </span>
            <span className="text-xs text-slate-500">{routine.timeOfDay}</span>
            {routine.isSpecialOccasion && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                occasion
              </span>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-white text-base truncate">{routine.name}</h3>
          <p className="text-slate-500 text-sm mt-0.5">
            {routine.steps.length} steps · {formatDuration(routine.estimatedDuration)}
          </p>

          {/* Days */}
          {!routine.isSpecialOccasion && routine.days.length > 0 && (
            <div className="flex gap-1 mt-2">
              {isAllDays ? (
                <span className="text-xs text-slate-400">Every day</span>
              ) : (
                ALL_DAYS.map((d) => (
                  <span
                    key={d}
                    className={`text-xs w-6 h-6 rounded flex items-center justify-center font-medium ${
                      routine.days.includes(d as Routine['days'][number])
                        ? 'bg-indigo-500/30 text-indigo-300'
                        : 'bg-slate-700 text-slate-600'
                    }`}
                  >
                    {DAY_SHORT[d]}
                  </span>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onPlay(routine.id)}
          className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 active:scale-95 transition-transform"
        >
          ▶
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
        <button
          onClick={() => onEdit(routine.id)}
          className="flex-1 text-xs py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDuplicate(routine.id)}
          className="flex-1 text-xs py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Duplicate
        </button>
        <button
          onClick={() => onExport(routine.id)}
          className="flex-1 text-xs py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
        >
          Export
        </button>
        <button
          onClick={() => onDelete(routine.id)}
          className="flex-1 text-xs py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
