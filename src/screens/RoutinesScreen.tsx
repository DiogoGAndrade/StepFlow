import { useState, useMemo } from 'react'
import { useStore } from '../store'
import RoutineCard from '../components/Routines/RoutineCard'
import RoutineEditor from '../components/Routines/RoutineEditor'
import ImportModal from '../components/Routines/ImportModal'
import TextToRoutineModal from '../components/TextToRoutine/TextToRoutineModal'
import type { Routine, Category } from '../types'

interface Props {
  onPlay: (routineId: string) => void
}

const CATEGORIES: (Category | 'all')[] = ['all', 'gym', 'skincare', 'study', 'tasks', 'custom']

export default function RoutinesScreen({ onPlay }: Props) {
  const { routines, deleteRoutine, duplicateRoutine, toggleFavorite } = useStore()
  const [editingRoutine, setEditingRoutine] = useState<Routine | null | 'new'>(null)
  const [showImport, setShowImport] = useState(false)
  const [showTextModal, setShowTextModal] = useState(false)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [search, setSearch] = useState('')

  function handleExport(id: string) {
    const routine = routines.find((r) => r.id === id)
    if (!routine) return
    const blob = new Blob([JSON.stringify(routine, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${routine.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete(id: string) {
    if (confirm('Delete this routine?')) deleteRoutine(id)
  }

  // Filter and sort: favorites first within filter
  const filtered = useMemo(() => {
    const base = routines.filter((r) => {
      const matchCat = filter === 'all' || r.category === filter
      const matchSearch = search === '' || r.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
    // Favorites first
    return [...base].sort((a, b) => {
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1
      return 0
    })
  }, [routines, filter, search])

  const favorites = useMemo(() => filtered.filter((r) => r.favorite), [filtered])
  const nonFavorites = useMemo(() => filtered.filter((r) => !r.favorite), [filtered])

  if (editingRoutine !== null) {
    return (
      <RoutineEditor
        routine={editingRoutine === 'new' ? undefined : editingRoutine}
        onClose={() => setEditingRoutine(null)}
      />
    )
  }

  return (
    <div className="pb-nav">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 bg-slate-800/50">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Routines</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="text-sm px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300"
            >
              Import
            </button>
            <button
              onClick={() => setShowTextModal(true)}
              className="text-sm px-3 py-1.5 rounded-xl bg-slate-700 text-slate-300"
            >
              From Text
            </button>
            <button
              onClick={() => setEditingRoutine('new')}
              className="text-sm px-3 py-1.5 rounded-xl bg-indigo-500 text-white font-medium"
            >
              + New
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search routines..."
          className="mt-3 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />

        {/* Category filter */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`flex-shrink-0 px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                filter === c
                  ? 'bg-indigo-500 border-indigo-400 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-lg font-medium">No routines found</p>
            <button
              onClick={() => setEditingRoutine('new')}
              className="mt-4 px-6 py-2.5 rounded-2xl bg-indigo-500 text-white text-sm font-medium"
            >
              Create your first routine
            </button>
          </div>
        ) : (
          <>
            {/* Favorites section */}
            {favorites.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                  ⭐ Favorites
                </h2>
                <div className="space-y-3">
                  {favorites.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      onEdit={(id) => setEditingRoutine(routines.find((r) => r.id === id) ?? null)}
                      onDuplicate={duplicateRoutine}
                      onDelete={handleDelete}
                      onPlay={onPlay}
                      onExport={handleExport}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Non-favorites (or all if no favorites) */}
            {nonFavorites.length > 0 && (
              <section>
                {favorites.length > 0 && (
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 mt-2">
                    All Routines
                  </h2>
                )}
                <div className="space-y-3">
                  {nonFavorites.map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      onEdit={(id) => setEditingRoutine(routines.find((r) => r.id === id) ?? null)}
                      onDuplicate={duplicateRoutine}
                      onDelete={handleDelete}
                      onPlay={onPlay}
                      onExport={handleExport}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} />}
      {showTextModal && <TextToRoutineModal onClose={() => setShowTextModal(false)} />}
    </div>
  )
}
