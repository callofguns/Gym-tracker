import { useRef, useState } from 'react'
import { ExerciseList } from '../components/ExerciseList'
import { ExerciseForm } from '../components/ExerciseForm'
import { useUI } from '../stores/ui'

export function Exercises({ scrollRoot }: { scrollRoot: React.RefObject<HTMLElement | null> }) {
  const push = useUI((s) => s.push)
  const [creating, setCreating] = useState(false)
  const fallback = useRef<HTMLElement>(null)
  return (
    <div className="tab-page">
      <div className="top-actions">
        <button className="text-btn" onClick={() => setCreating(true)}>
          New
        </button>
      </div>
      <h1 className="page-title">Exercises</h1>
      <ExerciseList onSelect={(e) => push({ kind: 'exerciseDetail', exerciseId: e.id })} scrollRoot={scrollRoot ?? fallback} />
      {creating && <ExerciseForm onClose={() => setCreating(false)} onSaved={() => setCreating(false)} />}
    </div>
  )
}
