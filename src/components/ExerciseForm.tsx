import { useState } from 'react'
import type { BodyPart, Category, Exercise, Muscle } from '../types'
import { BODY_PARTS, CATEGORIES, MUSCLES } from '../data/exercises'
import { db } from '../db'
import { uid } from '../lib/id'
import { useExercises } from '../hooks/data'
import { MuscleIcon } from './MuscleIcon'
import { IconClose } from './Icons'

const DEFAULT_MUSCLE: Record<BodyPart, Muscle> = {
  chest: 'chest',
  back: 'upper_back',
  shoulders: 'shoulders',
  arms: 'biceps',
  legs: 'quads',
  core: 'abs',
  full_body: 'full_body',
  cardio: 'cardio',
  other: 'full_body',
}

/** Create or edit a custom exercise. */
export function ExerciseForm({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Exercise
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const lib = useExercises()
  const [name, setName] = useState(existing?.name ?? '')
  const [bodyPart, setBodyPart] = useState<BodyPart>(existing?.bodyPart ?? 'chest')
  const [category, setCategory] = useState<Category>(existing?.category ?? 'barbell')
  const [muscle, setMuscle] = useState<Muscle>(existing?.muscle ?? 'chest')
  const [error, setError] = useState('')

  const save = async () => {
    const n = name.trim()
    if (!n) return setError('Give the exercise a name.')
    if (lib.list.some((e) => e.name.toLowerCase() === n.toLowerCase() && e.id !== existing?.id))
      return setError('An exercise with this name already exists.')
    const ex: Exercise = {
      id: existing?.id ?? `custom-${uid()}`,
      name: n,
      bodyPart,
      category,
      muscle,
      custom: true,
      createdAt: existing?.createdAt ?? Date.now(),
    }
    await db.customExercises.put(ex)
    onSaved(ex.id)
  }

  return (
    <div className="page sheet-page form-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">{existing ? 'Edit Exercise' : 'New Exercise'}</div>
        <button className="pill-btn blue" onClick={save}>
          Save
        </button>
      </header>
      <div className="page-scroll form">
        <div className="form-icon">
          <MuscleIcon muscle={muscle} size={88} />
        </div>
        <label className="field">
          <span>Name</span>
          <input
            className="text-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="e.g. Super Curls"
            autoFocus
          />
        </label>
        <label className="field">
          <span>Body Part</span>
          <select
            className="text-input"
            value={bodyPart}
            onChange={(e) => {
              const b = e.target.value as BodyPart
              setBodyPart(b)
              setMuscle(DEFAULT_MUSCLE[b])
            }}
          >
            {BODY_PARTS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Category</span>
          <select className="text-input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Main Muscle (icon)</span>
          <select className="text-input" value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle)}>
            {MUSCLES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {existing && <p className="hint">Changing the category changes which columns this exercise logs.</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
