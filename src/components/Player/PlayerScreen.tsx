import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../store'
import type { Step, CompletedSession } from '../../types'

interface Props {
  routineId: string
  onClose: () => void
}

// ---- Audio helpers ----
function createBeep(ctx: AudioContext, freq: number, duration: number, vol = 0.3) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.value = freq
  gain.gain.setValueAtTime(vol, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function beepEnd(ctx: AudioContext) {
  createBeep(ctx, 880, 0.15)
  setTimeout(() => createBeep(ctx, 1100, 0.2), 150)
  setTimeout(() => createBeep(ctx, 1320, 0.3), 300)
}

function beepTick(ctx: AudioContext) {
  createBeep(ctx, 440, 0.06, 0.1)
}

// ---- SVG Circular Timer ----
function CircularTimer({ progress, timeLeft, total }: { progress: number; timeLeft: number; total: number }) {
  const r = 80
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  const hue = progress > 0.3 ? 238 : progress > 0.1 ? 38 : 0
  const color = `hsl(${hue}, 80%, 65%)`

  return (
    <div className="relative flex items-center justify-center w-52 h-52">
      <svg className="absolute inset-0 -rotate-90" width="208" height="208" viewBox="0 0 208 208">
        <circle cx="104" cy="104" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="104" cy="104" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.5s' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-4xl font-bold text-white tabular-nums">
          {mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}s`}
        </div>
        <div className="text-slate-400 text-xs mt-1">{total}s total</div>
      </div>
    </div>
  )
}

type PhaseState =
  | { kind: 'step' }
  | { kind: 'rest'; setsDone: number; totalSets: number }

export default function PlayerScreen({ routineId, onClose }: Props) {
  const { routines, addSession } = useStore()
  const routine = routines.find((r) => r.id === routineId)

  const [stepIdx, setStepIdx] = useState(0)
  const [phase, setPhase] = useState<PhaseState>({ kind: 'step' })
  const [currentSet, setCurrentSet] = useState(1)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [checked, setChecked] = useState(false)
  const [completedSteps, setCompletedSteps] = useState(0)
  const [sessionStart] = useState(Date.now())
  const [voiceEnabled, setVoiceEnabled] = useState(true)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    return audioCtxRef.current
  }

  const step = routine?.steps[stepIdx]
  const nextStep = routine?.steps[stepIdx + 1]
  const isLast = stepIdx === (routine?.steps.length ?? 0) - 1

  const stepDuration = step?.type === 'timer' || step?.type === 'rest'
    ? step.duration ?? 0
    : phase.kind === 'rest' && step?.type === 'reps'
    ? step.restDuration ?? 60
    : null

  function speak(text: string) {
    if (!voiceEnabled) return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.95
    window.speechSynthesis.speak(utt)
  }

  const announceStep = useCallback(
    (s: Step, ph: PhaseState, set?: number) => {
      if (!voiceEnabled) return
      if (ph.kind === 'rest') {
        speak(`Rest. ${s.restDuration ?? 60} seconds.`)
        return
      }
      const text =
        s.voiceText ??
        (s.type === 'reps'
          ? `${s.name}. Set ${set ?? 1} of ${s.sets ?? 1}. ${s.reps} reps.`
          : s.type === 'timer'
          ? `${s.name}. ${s.duration} seconds.`
          : s.name)
      speak(text)
    },
    [voiceEnabled] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Initialize step
  useEffect(() => {
    if (!step) return
    setChecked(false)
    setRunning(false)
    if (timerRef.current) clearInterval(timerRef.current)

    if (phase.kind === 'rest') {
      const dur = step.restDuration ?? 60
      setTimeLeft(dur)
      setRunning(true)
    } else if (step.type === 'timer' || step.type === 'rest') {
      setTimeLeft(step.duration ?? 60)
    } else {
      setTimeLeft(null)
    }
    announceStep(step, phase, currentSet)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, phase, currentSet])

  // Timer tick
  useEffect(() => {
    if (!running || timeLeft === null) return
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null
        if (prev <= 4 && prev > 1) beepTick(getAudioCtx())
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          beepEnd(getAudioCtx())
          setRunning(false)
          setTimeout(() => advance(), 300)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  function advance() {
    if (!step || !routine) return

    // If reps step — cycle through sets or go to rest between sets
    if (step.type === 'reps' && phase.kind === 'step') {
      const totalSets = step.sets ?? 1
      if (currentSet < totalSets) {
        // Go to rest phase
        setPhase({ kind: 'rest', setsDone: currentSet, totalSets })
        return
      }
    }

    // If we were in rest phase — go back to step phase next set
    if (phase.kind === 'rest' && step.type === 'reps') {
      const nextSet = phase.setsDone + 1
      setCurrentSet(nextSet)
      setPhase({ kind: 'step' })
      return
    }

    // Move to next step
    setCompletedSteps((n) => n + 1)
    if (isLast) {
      finishSession()
      return
    }
    setStepIdx((n) => n + 1)
    setPhase({ kind: 'step' })
    setCurrentSet(1)
  }

  function finishSession() {
    const session: CompletedSession = {
      id: `session-${Date.now()}`,
      routineId: routine!.id,
      routineName: routine!.name,
      category: routine!.category,
      completedAt: new Date().toISOString(),
      duration: Math.round((Date.now() - sessionStart) / 1000),
      stepsCompleted: completedSteps + 1,
      totalSteps: routine!.steps.length
    }
    addSession(session)
    if (voiceEnabled) speak('Routine complete! Great job!')
    beepEnd(getAudioCtx())
    onClose()
  }

  function handleStart() {
    if (!step) return
    if (step.type === 'timer' || step.type === 'rest') {
      setRunning(true)
    }
  }

  function handleSkip() {
    if (timerRef.current) clearInterval(timerRef.current)
    setRunning(false)
    advance()
  }

  function handleCheck() {
    setChecked(true)
    beepEnd(getAudioCtx())
    setTimeout(() => advance(), 400)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  if (!routine || !step) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Routine not found</p>
      </div>
    )
  }

  const totalSteps = routine.steps.length
  const overallProgress = stepIdx / totalSteps
  const isTimerStep = step.type === 'timer' || step.type === 'rest' || phase.kind === 'rest'
  const timerProgress = timeLeft !== null && stepDuration ? 1 - timeLeft / stepDuration : 1

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3">
        <button onClick={onClose} className="text-slate-400 text-sm">✕ Exit</button>
        <div className="text-center">
          <p className="text-xs text-slate-500">{routine.name}</p>
          <p className="text-xs text-slate-600">
            Step {stepIdx + 1} of {totalSteps}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className={`text-sm px-2 py-1 rounded-lg ${voiceEnabled ? 'text-indigo-400' : 'text-slate-600'}`}
          >
            🔊
          </button>
          <button onClick={toggleFullscreen} className="text-slate-500 text-sm px-2 py-1 rounded-lg">
            ⛶
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${overallProgress * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Phase label */}
        {phase.kind === 'rest' && (
          <div className="px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium">
            Rest — set {phase.setsDone} of {phase.totalSets} done
          </div>
        )}
        {step.type === 'reps' && phase.kind === 'step' && (
          <div className="px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-medium">
            Set {currentSet} of {step.sets ?? 1}
          </div>
        )}

        {/* Step name */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {phase.kind === 'rest' ? 'Rest' : step.name}
          </h2>
          {step.type === 'reps' && phase.kind === 'step' && (
            <p className="text-4xl font-black text-indigo-400 mt-2">{step.reps} reps</p>
          )}
          {step.product && (
            <p className="text-indigo-300 text-sm mt-2">{step.product}</p>
          )}
          {step.warning && (
            <p className="text-yellow-400 text-xs mt-2 bg-yellow-500/10 px-3 py-1 rounded-lg">
              ⚠️ {step.warning}
            </p>
          )}
          {step.description && phase.kind !== 'rest' && (
            <p className="text-slate-400 text-sm mt-2 max-w-xs">{step.description}</p>
          )}
        </div>

        {/* Timer */}
        {isTimerStep && timeLeft !== null && stepDuration && (
          <CircularTimer
            progress={timerProgress}
            timeLeft={timeLeft}
            total={stepDuration}
          />
        )}

        {/* Check */}
        {step.type === 'check' && (
          <button
            onClick={handleCheck}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl border-4 transition-all ${
              checked
                ? 'bg-green-500/30 border-green-400 text-green-300'
                : 'bg-slate-800 border-slate-600 text-slate-400 active:scale-95'
            }`}
          >
            {checked ? '✓' : '○'}
          </button>
        )}

        {/* Reps done button */}
        {step.type === 'reps' && phase.kind === 'step' && (
          <button
            onClick={advance}
            className="px-8 py-4 rounded-2xl bg-indigo-500 text-white font-bold text-lg active:scale-95 transition-transform"
          >
            Done — Set {currentSet}
          </button>
        )}

        {/* Instruction done */}
        {step.type === 'instruction' && (
          <button
            onClick={advance}
            className="px-8 py-4 rounded-2xl bg-indigo-500 text-white font-bold text-lg active:scale-95 transition-transform"
          >
            Got it →
          </button>
        )}

        {/* Timer controls */}
        {isTimerStep && !running && timeLeft !== null && timeLeft > 0 && (
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-2xl bg-indigo-500 text-white font-bold text-lg active:scale-95 transition-transform"
          >
            ▶ Start
          </button>
        )}
        {isTimerStep && running && (
          <button
            onClick={() => setRunning(false)}
            className="px-8 py-4 rounded-2xl bg-slate-700 text-white font-bold text-lg"
          >
            ⏸ Pause
          </button>
        )}
        {isTimerStep && !running && timeLeft !== null && timeLeft > 0 && (
          <button
            onClick={() => setRunning(true)}
            className="text-slate-500 text-sm"
          >
            Resume
          </button>
        )}
      </div>

      {/* Next step preview */}
      <div className="px-4 pb-8">
        {nextStep ? (
          <div className="flex items-center gap-3 bg-slate-800/70 rounded-2xl px-4 py-3 border border-slate-700">
            <span className="text-slate-500 text-xs">Next</span>
            <div className="flex-1">
              <p className="text-slate-300 text-sm font-medium">{nextStep.name}</p>
              <p className="text-slate-500 text-xs">{nextStep.type}</p>
            </div>
            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 px-3 py-1 rounded-lg bg-slate-700"
            >
              Skip
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 bg-green-500/10 rounded-2xl px-4 py-3 border border-green-500/20">
            <span className="text-green-400 text-sm">🏁 Last step</span>
            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 px-3 py-1 rounded-lg bg-slate-700 ml-auto"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
