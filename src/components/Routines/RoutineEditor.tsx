import { useState } from 'react'
import { useStore } from '../../store'
import type { Routine, Step, StepType, Category, TimeOfDay, DayOfWeek } from '../../types'

interface Props {
  routine?: Routine
  onClose: () => void
}

const CATEGORIES: Category[] = ['gym', 'skincare', 'study', 'tasks', 'custom']
const TIMES: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'manual']
const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const STEP_TYPES: StepType[] = ['instruction', 'timer', 'reps', 'check', 'rest']

function makeStep(type: StepType): Step {
  const base = { id: `step-${Date.now()}-${Math.random()}`, type, name: '' }
  if (type === 'timer' || type === 'rest') return { ...base, duration: 60 }
  if (type === 'reps') return { ...base, sets: 3, reps: 10, restDuration: 60 }
  return base
}

function formatSec(s: number) {
  const m = Math.floor(s / 60)
  const r = s % 60
  return r === 0 ? `${m}m` : `${m}m ${r}s`
}

export default function RoutineEditor({ routine, onClose }: Props) {
  const { addRoutine, updateRoutine } = useStore()
  const isNew = !routine

  const [name, setName] = useState(routine?.name ?? '')
  const [category, setCategory] = useState<Category>(routine?.category ?? 'custom')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(routine?.timeOfDay ?? 'morning')
  const [days, setDays] = useState<DayOfWeek[]>(routine?.days ?? [])
  const [isSpecialOccasion, setIsSpecialOccasion] = useState(routine?.isSpecialOccasion ?? false)
  const [scheduledTime, setScheduledTime] = useState(routine?.scheduledTime ?? '')
  const [showTimeInput, setShowTimeInput] = useState(!!(routine?.scheduledTime))
  const [notificationEnabled, setNotificationEnabled] = useState(routine?.notificationEnabled ?? false)
  const [steps, setSteps] = useState<Step[]>(routine?.steps ?? [])
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  function toggleDay(d: DayOfWeek) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  function estimateDuration(ss: Step[]): number {
    let total = 0
    for (const s of ss) {
      if (s.type === 'timer' || s.type === 'rest') total += (s.duration ?? 60)
      else if (s.type === 'reps') total += ((s.sets ?? 1) * 30) + ((s.sets ?? 1) - 1) * (s.restDuration ?? 60)
      else total += 30
    }
    return Math.ceil(total / 60)
  }

  function save() {
    if (!name.trim()) return
    const now = new Date().toISOString()
    const updated: Routine = {
      id: routine?.id ?? `routine-${Date.now()}`,
      name: name.trim(),
      category,
      timeOfDay,
      days,
      isSpecialOccasion,
      scheduledTime: showTimeInput && scheduledTime ? scheduledTime : undefined,
      notificationEnabled: notificationEnabled || undefined,
      steps,
      estimatedDuration: estimateDuration(steps),
      createdAt: routine?.createdAt ?? now,
      updatedAt: now
    }
    if (isNew) addRoutine(updated)
    else updateRoutine(updated)
    onClose()
  }

  function addStep(type: StepType) {
    const s = makeStep(type)
    setSteps((prev) => [...prev, s])
    setEditingStep(s)
    setExpandedStep(s.id)
  }

  function updateStep(updated: Step) {
    setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setEditingStep(updated)
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id))
    if (expandedStep === id) setExpandedStep(null)
    if (editingStep?.id === id) setEditingStep(null)
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const arr = [...steps]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setSteps(arr)
  }

  const DAY_SHORT: Record<DayOfWeek, string> = {
    monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th',
    friday: 'Fr', saturday: 'Sa', sunday: 'Su'
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 bg-slate-800 border-b border-slate-700">
        <button onClick={onClose} className="text-slate-400 text-sm px-3 py-1 rounded-lg bg-slate-700">
          Cancel
        </button>
        <h1 className="font-bold text-white">{isNew ? 'New Routine' : 'Edit Routine'}</h1>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="text-sm px-3 py-1 rounded-lg bg-indigo-500 text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="px-4 py-4 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Routine name..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    category === c
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
              Time of Day
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeOfDay(t)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    timeOfDay === t
                      ? 'bg-indigo-500 border-indigo-400 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled time — shown always when timeOfDay='manual', togglable otherwise */}
          {timeOfDay === 'manual' ? (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                Scheduled Time
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Set specific time</p>
                <button
                  onClick={() => setShowTimeInput((v) => !v)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    showTimeInput ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      showTimeInput ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {showTimeInput && (
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          )}

          {/* Days */}
          {!isSpecialOccasion && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                Days
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      days.includes(d)
                        ? 'bg-indigo-500 border-indigo-400 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                  >
                    {DAY_SHORT[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Occasion toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Special Occasion</p>
              <p className="text-xs text-slate-500">Run manually, not on schedule</p>
            </div>
            <button
              onClick={() => setIsSpecialOccasion((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                isSpecialOccasion ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  isSpecialOccasion ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Enable reminder notification */}
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <p className="text-sm font-medium text-white">Enable Reminder</p>
              <p className="text-xs text-slate-500">Requires notification permission in Settings</p>
            </div>
            <button
              onClick={() => setNotificationEnabled((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                notificationEnabled ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
              Steps ({steps.length})
            </label>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={step.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-3 py-3 cursor-pointer"
                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                  >
                    <span className="text-slate-500 text-xs w-5 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {step.name || `(${step.type})`}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {step.type}
                        {(step.type === 'timer' || step.type === 'rest') && step.duration
                          ? ` · ${formatSec(step.duration)}`
                          : ''}
                        {step.type === 'reps' && step.sets
                          ? ` · ${step.sets}×${step.reps ?? '?'}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); moveStep(idx, -1) }} className="text-slate-500 px-1 disabled:opacity-20" disabled={idx === 0}>↑</button>
                      <button onClick={(e) => { e.stopPropagation(); moveStep(idx, 1) }} className="text-slate-500 px-1 disabled:opacity-20" disabled={idx === steps.length - 1}>↓</button>
                      <button onClick={(e) => { e.stopPropagation(); removeStep(step.id) }} className="text-red-400 px-1">✕</button>
                    </div>
                  </div>

                  {expandedStep === step.id && (
                    <StepForm step={step} onChange={updateStep} />
                  )}
                </div>
              ))}
            </div>

            {/* Add step */}
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Add step:</p>
              <div className="flex flex-wrap gap-2">
                {STEP_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => addStep(t)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepForm({ step, onChange }: { step: Step; onChange: (s: Step) => void }) {
  return (
    <div className="px-3 pb-3 border-t border-slate-700 pt-3 space-y-2.5">
      <input
        value={step.name}
        onChange={(e) => onChange({ ...step, name: e.target.value })}
        placeholder="Step name..."
        className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {(step.type === 'timer' || step.type === 'rest') && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-16">Duration</label>
          <input
            type="number"
            min={5}
            value={step.duration ?? 60}
            onChange={(e) => onChange({ ...step, duration: Number(e.target.value) })}
            className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-500">sec</span>
        </div>
      )}

      {step.type === 'reps' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sets</label>
              <input
                type="number" min={1}
                value={step.sets ?? 3}
                onChange={(e) => onChange({ ...step, sets: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Reps</label>
              <input
                type="number" min={1}
                value={step.reps ?? 10}
                onChange={(e) => onChange({ ...step, reps: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Rest (s)</label>
              <input
                type="number" min={0}
                value={step.restDuration ?? 60}
                onChange={(e) => onChange({ ...step, restDuration: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-2 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </>
      )}

      {step.type === 'check' && (
        <input
          value={step.product ?? ''}
          onChange={(e) => onChange({ ...step, product: e.target.value })}
          placeholder="Product name (optional)..."
          className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
        />
      )}

      <textarea
        value={step.description ?? ''}
        onChange={(e) => onChange({ ...step, description: e.target.value })}
        placeholder="Description (optional)..."
        rows={2}
        className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none resize-none"
      />

      <input
        value={step.voiceText ?? ''}
        onChange={(e) => onChange({ ...step, voiceText: e.target.value })}
        placeholder="Voice announcement (optional)..."
        className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
      />
    </div>
  )
}
