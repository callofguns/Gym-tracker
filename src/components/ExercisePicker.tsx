import { useRef, useState } from 'react'
import type { Exercise } from '../types'
import { ExerciseList } from './ExerciseList'
import { IconClose } from './Icons'
import { ExerciseForm } from './ExerciseForm'

interface Props {
  multi: boolean
  title?: string
  onDone: (ids: string[]) => void
  onClose: () => void
}

export function ExercisePicker({ multi, title = 'Add Exercises', onDone, onClose }: Props) {
  const [sel, setSel] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const tap = (e: Exercise) => {
    if (!multi) return onDone([e.id])
    setSel((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))
  }

  return (
    <div className="page sheet-page picker">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
        <button className="text-btn" onClick={() => setCreating(true)}>
          New
        </button>
        <div className="grow" />
        {multi && (
          <button className="pill-btn blue" disabled={!sel.length} onClick={() => onDone(sel)}>
            Add{sel.length ? ` (${sel.length})` : ''}
          </button>
        )}
      </header>
      <div className="page-scroll" ref={scrollRef}>
        <h1 className="page-title small">{title}</h1>
        <ExerciseList onSelect={tap} selected={new Set(sel)} scrollRoot={scrollRef} />
      </div>
      {creating && (
        <ExerciseForm
          onClose={() => setCreating(false)}
          onSaved={(id) => {
            setCreating(false)
            if (multi) setSel((s) => [...s, id])
            else onDone([id])
          }}
        />
      )}
    </div>
  )
}
