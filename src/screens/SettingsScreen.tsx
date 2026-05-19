import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import {
  requestNotificationPermission,
  isNotificationSupported
} from '../services/notificationService'
import type { Category } from '../types'

const CATEGORY_LABELS: Record<Category, string> = {
  gym: 'Gym (energetic)',
  skincare: 'Skincare (calm)',
  study: 'Study (focus)',
  tasks: 'Tasks',
  custom: 'Custom'
}

function Toggle({
  value,
  onChange,
  label
}: {
  value: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${
        value ? 'bg-indigo-500' : 'bg-slate-700'
      }`}
      aria-label={label}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          value ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function Slider({
  value,
  min,
  max,
  step,
  onChange
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 accent-indigo-500"
    />
  )
}

export default function SettingsScreen() {
  const { settings, updateSettings, routines, sessions, importData } = useStore()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [notifStatus, setNotifStatus] = useState<string>('unknown')
  const fileRef = useRef<HTMLInputElement>(null)

  // Load available voices
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis?.getVoices() ?? []
      if (v.length > 0) setVoices(v)
    }
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
  }, [])

  // Check notification status
  useEffect(() => {
    if (!isNotificationSupported()) {
      setNotifStatus('not-supported')
    } else {
      setNotifStatus(Notification.permission)
    }
  }, [])

  function testVoice() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(
      'Step 3 of 5. Bench Press. Set 2 of 4. 10 reps.'
    )
    utt.rate = settings.voice.rate
    utt.pitch = settings.voice.pitch
    if (settings.voice.voiceURI) {
      const found = window.speechSynthesis.getVoices().find((v) => v.voiceURI === settings.voice.voiceURI)
      if (found) utt.voice = found
    }
    window.speechSynthesis.speak(utt)
  }

  async function handleRequestNotification() {
    const perm = await requestNotificationPermission()
    updateSettings({ notificationsGranted: perm === 'granted' })
    setNotifStatus(perm)
  }

  function handleExport() {
    const data = {
      routines,
      sessions,
      settings,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stepflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(data.routines)) {
          alert('Invalid backup file: missing routines array.')
          return
        }
        if (
          confirm(
            `This will replace all your data with ${data.routines.length} routines and ${
              data.sessions?.length ?? 0
            } sessions. Continue?`
          )
        ) {
          importData({
            routines: data.routines,
            sessions: data.sessions ?? [],
            settings: data.settings
          })
          alert('Import successful!')
        }
      } catch {
        alert('Failed to parse backup file.')
      }
    }
    reader.readAsText(file)
    // Reset file input
    e.target.value = ''
  }

  const notifStatusLabel: Record<string, string> = {
    granted: 'Granted',
    denied: 'Denied',
    default: 'Not yet requested',
    'not-supported': 'Not supported',
    unknown: '...'
  }

  const notifStatusColor: Record<string, string> = {
    granted: 'text-green-400',
    denied: 'text-red-400',
    default: 'text-slate-400',
    'not-supported': 'text-slate-500',
    unknown: 'text-slate-500'
  }

  return (
    <div className="pb-nav">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-800/50">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          {routines.length} routines · {sessions.length} sessions
        </p>
      </div>

      <div className="px-4 mt-4 space-y-6 pb-8">

        {/* ---- Voice Settings ---- */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Voice
          </h2>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-4">

            {/* Voice selector */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Voice</label>
              <select
                value={settings.voice.voiceURI ?? ''}
                onChange={(e) =>
                  updateSettings({
                    voice: { ...settings.voice, voiceURI: e.target.value || null }
                  })
                }
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">System default</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Rate */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-400">Rate</label>
                <span className="text-xs text-indigo-400 font-mono">{settings.voice.rate.toFixed(2)}</span>
              </div>
              <Slider
                value={settings.voice.rate}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={(v) => updateSettings({ voice: { ...settings.voice, rate: v } })}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>0.5×</span><span>2.0×</span>
              </div>
            </div>

            {/* Pitch */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-slate-400">Pitch</label>
                <span className="text-xs text-indigo-400 font-mono">{settings.voice.pitch.toFixed(2)}</span>
              </div>
              <Slider
                value={settings.voice.pitch}
                min={0.5}
                max={2.0}
                step={0.05}
                onChange={(v) => updateSettings({ voice: { ...settings.voice, pitch: v } })}
              />
              <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                <span>0.5</span><span>2.0</span>
              </div>
            </div>

            {/* Test button */}
            <button
              onClick={testVoice}
              className="w-full py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium active:scale-95 transition-transform"
            >
              🔊 Test Voice
            </button>
          </div>
        </section>

        {/* ---- Music Settings ---- */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Music
          </h2>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-4">

            {/* Enable music */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Enable Music</p>
                <p className="text-xs text-slate-500">Play background music during routines</p>
              </div>
              <Toggle
                value={settings.music.enabled}
                onChange={(v) => updateSettings({ music: { ...settings.music, enabled: v } })}
                label="Enable music"
              />
            </div>

            {settings.music.enabled && (
              <>
                {/* Volume */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400">Volume</label>
                    <span className="text-xs text-indigo-400 font-mono">
                      {Math.round(settings.music.volume * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={settings.music.volume}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => updateSettings({ music: { ...settings.music, volume: v } })}
                  />
                </div>

                {/* Mute */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">Muted</p>
                  <Toggle
                    value={settings.music.muted}
                    onChange={(v) => updateSettings({ music: { ...settings.music, muted: v } })}
                    label="Mute music"
                  />
                </div>

                {/* Per-category toggles */}
                <div>
                  <p className="text-xs text-slate-400 mb-2">Enable per category:</p>
                  <div className="space-y-2">
                    {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                      <div key={cat} className="flex items-center justify-between">
                        <p className="text-sm text-slate-300">{CATEGORY_LABELS[cat]}</p>
                        <Toggle
                          value={settings.music.perCategory[cat] ?? false}
                          onChange={(v) =>
                            updateSettings({
                              music: {
                                ...settings.music,
                                perCategory: { ...settings.music.perCategory, [cat]: v }
                              }
                            })
                          }
                          label={`Music for ${cat}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="bg-slate-700/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">
                Music files should be placed in /audio/ — see ROADMAP for details.
                Expected files: gym-energetic.mp3, skincare-calm.mp3, study-focus.mp3,
                tasks-calm.mp3, custom-calm.mp3
              </p>
            </div>
          </div>
        </section>

        {/* ---- Notifications ---- */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Notifications
          </h2>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white">Permission Status</p>
              <span className={`text-sm font-medium ${notifStatusColor[notifStatus] ?? 'text-slate-400'}`}>
                {notifStatusLabel[notifStatus] ?? notifStatus}
              </span>
            </div>

            {notifStatus !== 'granted' && notifStatus !== 'not-supported' && (
              <button
                onClick={handleRequestNotification}
                className="w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium active:scale-95 transition-transform"
              >
                Enable Notifications
              </button>
            )}

            <div className="bg-slate-700/50 rounded-xl p-3">
              <p className="text-xs text-slate-500">
                Reliable background push reminders require a backend/push service and will be added
                in a future Appwrite phase. Current notifications work only while the app is open.
              </p>
            </div>
          </div>
        </section>

        {/* ---- Data ---- */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Data
          </h2>
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
            <p className="text-xs text-slate-400">
              {routines.length} routines · {sessions.length} sessions stored locally
            </p>

            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium active:scale-95 transition-transform"
            >
              Export All Data
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium active:scale-95 transition-transform"
            >
              Import Backup
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
