import { useState } from 'react'
import type { Screen } from './types'
import BottomNav from './components/Navigation/BottomNav'
import TodayScreen from './screens/TodayScreen'
import RoutinesScreen from './screens/RoutinesScreen'
import HistoryScreen from './screens/HistoryScreen'
import PlayerScreen from './components/Player/PlayerScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('today')
  const [playingRoutineId, setPlayingRoutineId] = useState<string | null>(null)

  function handlePlay(routineId: string) {
    setPlayingRoutineId(routineId)
  }

  function handleClosePlayer() {
    setPlayingRoutineId(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {screen === 'today' && <TodayScreen onPlay={handlePlay} />}
      {screen === 'routines' && <RoutinesScreen onPlay={handlePlay} />}
      {screen === 'history' && <HistoryScreen />}

      <BottomNav current={screen} onChange={setScreen} />

      {playingRoutineId && (
        <PlayerScreen routineId={playingRoutineId} onClose={handleClosePlayer} />
      )}
    </div>
  )
}
