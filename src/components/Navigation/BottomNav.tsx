import type { Screen } from '../../types'

interface Props {
  current: Screen
  onChange: (screen: Screen) => void
}

const tabs: { id: Screen; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'routines', label: 'Routines', icon: '📋' },
  { id: 'history', label: 'History', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
]

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur border-t border-slate-700 safe-bottom z-40">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              current === tab.id ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
