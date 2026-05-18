import { useState } from 'react'
import { useStore } from '../../store'
import type { Routine } from '../../types'

interface Props {
  onClose: () => void
}

function parseNaturalText(text: string): Routine | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  const now = new Date().toISOString()
  const routine: Routine = {
    id: `routine-${Date.now()}`,
    name: lines[0],
    category: 'custom',
    timeOfDay: 'manual',
    days: [],
    steps: [],
    estimatedDuration: 0,
    createdAt: now,
    updatedAt: now
  }

  for (const line of lines.slice(1)) {
    const lower = line.toLowerCase()
    if (lower.includes('gym') || lower.includes('workout') || lower.includes('exercise')) routine.category = 'gym'
    else if (lower.includes('skin') || lower.includes('cleanser') || lower.includes('moistur')) routine.category = 'skincare'
    else if (lower.includes('study') || lower.includes('work') || lower.includes('read')) routine.category = 'study'

    if (lower.includes('morning')) routine.timeOfDay = 'morning'
    else if (lower.includes('evening') || lower.includes('night')) routine.timeOfDay = 'evening'
    else if (lower.includes('afternoon')) routine.timeOfDay = 'afternoon'

    const timerMatch = line.match(/(\d+)\s*(min|minute|sec|second)/i)
    if (timerMatch) {
      const val = parseInt(timerMatch[1])
      const unit = timerMatch[2].toLowerCase()
      const duration = unit.startsWith('min') ? val * 60 : val
      routine.steps.push({
        id: `step-${Date.now()}-${Math.random()}`,
        type: 'timer',
        name: line,
        duration
      })
      continue
    }

    const repsMatch = line.match(/(\d+)\s*[x×]\s*(\d+)/i)
    if (repsMatch) {
      routine.steps.push({
        id: `step-${Date.now()}-${Math.random()}`,
        type: 'reps',
        name: line,
        sets: parseInt(repsMatch[1]),
        reps: parseInt(repsMatch[2]),
        restDuration: 60
      })
      continue
    }

    if (line.length > 3) {
      routine.steps.push({
        id: `step-${Date.now()}-${Math.random()}`,
        type: 'instruction',
        name: line
      })
    }
  }

  routine.estimatedDuration = Math.ceil(
    routine.steps.reduce((acc, s) => {
      if (s.duration) return acc + s.duration
      if (s.type === 'reps') return acc + (s.sets ?? 1) * 30 + ((s.sets ?? 1) - 1) * (s.restDuration ?? 60)
      return acc + 30
    }, 0) / 60
  )

  return routine
}

export default function ImportModal({ onClose }: Props) {
  const { addRoutine } = useStore()
  const [text, setText] = useState('')
  const [mode, setMode] = useState<'json' | 'text'>('json')
  const [error, setError] = useState('')

  function handleImport() {
    setError('')
    try {
      if (mode === 'json') {
        const parsed = JSON.parse(text)
        const routines: Routine[] = Array.isArray(parsed) ? parsed : [parsed]
        for (const r of routines) {
          if (!r.id || !r.name) throw new Error('Invalid routine format — missing id or name')
          addRoutine({ ...r, id: `routine-${Date.now()}-${Math.random()}` })
        }
        onClose()
      } else {
        const routine = parseNaturalText(text)
        if (!routine) { setError('Could not parse routine from text'); return }
        addRoutine(routine)
        onClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
      <div className="w-full bg-slate-800 rounded-t-3xl border-t border-slate-700 p-5 pb-10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-lg">Import Routine</h2>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>

        {/* Mode */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('json')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === 'json' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === 'text' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            Natural Text
          </button>
        </div>

        <p className="text-xs text-slate-500 mb-2">
          {mode === 'json'
            ? 'Paste a routine JSON object or array of routines'
            : 'Paste a plain-text description. First line = name. Mention times (5 min), sets (3x10), or steps.'}
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            mode === 'json'
              ? '{ "id": "...", "name": "...", ... }'
              : 'Morning Yoga\n10 min warm up\nDownward Dog 3x10\nEvening meditation'
          }
          rows={8}
          className="flex-1 bg-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
        />

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <button
          onClick={handleImport}
          disabled={!text.trim()}
          className="mt-4 w-full py-3 rounded-2xl bg-indigo-500 text-white font-semibold disabled:opacity-40"
        >
          Import
        </button>
      </div>
    </div>
  )
}
