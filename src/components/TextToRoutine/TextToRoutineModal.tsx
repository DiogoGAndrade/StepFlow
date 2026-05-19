import { useState } from 'react'
import { useStore } from '../../store'
import { parseTextToRoutine } from '../../services/textParser'
import type { Routine } from '../../types'

interface Props {
  onClose: () => void
}

const EXAMPLE_PROMPTS = [
  '4-day gym push/pull/legs/upper hypertrophy plan with warmups',
  'Morning skincare with cleanser, toner, moisturizer, sunscreen',
  'Weekly study plan: 5 sessions of 45 minutes'
]

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-red-400 bg-red-500/10 border-red-500/30'
}

const STEP_TYPE_LABELS: Record<string, string> = {
  instruction: 'Instruction',
  timer: 'Timer',
  reps: 'Reps',
  check: 'Check',
  rest: 'Rest'
}

function formatStepMeta(step: Routine['steps'][number]): string {
  if (step.type === 'timer' || step.type === 'rest') {
    const s = step.duration ?? 60
    const m = Math.floor(s / 60)
    const r = s % 60
    return r === 0 ? `${m}m` : `${m}m ${r}s`
  }
  if (step.type === 'reps') return `${step.sets ?? 1} × ${step.reps ?? 10} reps`
  return ''
}

export default function TextToRoutineModal({ onClose }: Props) {
  const { addRoutine } = useStore()
  const [text, setText] = useState('')
  const [parseResult, setParseResult] = useState<ReturnType<typeof parseTextToRoutine> | null>(null)
  const [editedName, setEditedName] = useState('')
  const [saved, setSaved] = useState(false)

  function handleGenerate() {
    if (!text.trim()) return
    const result = parseTextToRoutine(text.trim())
    setParseResult(result)
    setEditedName(result.routine.name)
    setSaved(false)
  }

  function handleSave() {
    if (!parseResult) return
    const routine: Routine = {
      ...parseResult.routine,
      name: editedName.trim() || parseResult.routine.name
    }
    addRoutine(routine)
    setSaved(true)
    setTimeout(() => onClose(), 700)
  }

  function handleExampleClick(example: string) {
    setText(example)
    setParseResult(null)
    setSaved(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-slate-800 border-b border-slate-700 flex-shrink-0">
        <button onClick={onClose} className="text-slate-400 text-sm px-3 py-1 rounded-lg bg-slate-700">
          Cancel
        </button>
        <h1 className="font-bold text-white">Create from Text</h1>
        <div className="w-16" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-4 py-4 space-y-4">

          {/* Info banner */}
          <div className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
            <span className="text-lg flex-shrink-0">⚡</span>
            <p className="text-xs text-indigo-300">
              This is a local rule-based generator. AI generation will be available in a future update.
            </p>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              Describe your routine
            </label>
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setParseResult(null) }}
              placeholder="Describe your routine in natural language..."
              rows={5}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Example prompts */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 transition-colors text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold disabled:opacity-40 active:scale-95 transition-transform"
          >
            Generate Routine
          </button>

          {/* Preview section */}
          {parseResult && (
            <div className="space-y-3 mt-2">
              <div className="h-px bg-slate-700" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Preview</h2>

              {/* Routine name (editable) */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Routine Name</label>
                <input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category + confidence */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {parseResult.routine.category}
                </span>
                <span className="text-xs px-2 py-1 rounded-full border font-medium capitalize">
                  {/* time of day */}
                  {parseResult.routine.timeOfDay}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full border font-medium ${
                    CONFIDENCE_COLORS[parseResult.confidence]
                  }`}
                >
                  {parseResult.confidence} confidence
                </span>
                {parseResult.isDraft && (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    draft
                  </span>
                )}
              </div>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 space-y-1">
                  {parseResult.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-300">⚠ {w}</p>
                  ))}
                </div>
              )}

              {/* Steps list */}
              <div>
                <p className="text-xs text-slate-400 mb-2">{parseResult.routine.steps.length} steps</p>
                <div className="space-y-1.5">
                  {parseResult.routine.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700"
                    >
                      <span className="text-slate-600 text-xs w-5 text-center flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{step.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-slate-500">{STEP_TYPE_LABELS[step.type]}</span>
                        {formatStepMeta(step) && (
                          <span className="text-xs text-indigo-400">{formatStepMeta(step)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save / Edit actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-semibold disabled:opacity-60 active:scale-95 transition-transform"
                >
                  {saved ? '✓ Saved!' : 'Save Routine'}
                </button>
                <button
                  onClick={() => {
                    setParseResult(null)
                    setText('')
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
