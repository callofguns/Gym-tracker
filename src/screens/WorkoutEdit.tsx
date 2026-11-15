import { useState } from 'react'
import { db } from '../db'
import { useExercises, usePreviousSets, useWorkouts } from '../hooks/data'
import { SetEditor } from '../components/SetEditor'
import { IconClose } from '../components/Icons'
import { confirmDialog } from '../components/overlay'
import { cleanExercises } from '../lib/sets'
import { findPRs, recordsByExercise } from '../lib/records'
import { toLocalInput } from '../lib/format'
import type { WExercise, Workout } from '../types'

export function WorkoutEdit({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  const lib = useExercises()
  const workouts = useWorkouts()
  const [name, setName] = useState(workout.name)
  const [start, setStart] = useState(toLocalInput(workout.startedAt))
  const [minutes, setMinutes] = useState(String(Math.max(1, Math.round((workout.endedAt - workout.startedAt) / 60000))))
  const [exercises, setExercises] = useState<WExercise[]>(workout.exercises)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const previous = usePreviousSets(workout.startedAt, workout.id)

  const update = (fn: (e: WExercise[]) => WExercise[]) => {
    setDirty(true)
    setExercises(fn)
  }

  const close = async () => {
    if (dirty) {
      const ok = await confirmDialog({
        title: 'Discard Changes?',
        message: 'Your changes to this workout will be lost.',
        buttons: [
          { label: 'Discard', variant: 'red', value: true },
          { label: 'Keep Editing', variant: 'plain', value: false },
        ],
      })
      if (!ok) return
    }
    onClose()
  }

  const save = async () => {
    const startedAt = new Date(start).getTime()
    const mins = Number(minutes)
    if (!name.trim()) return setError('Give the workout a name.')
    if (!Number.isFinite(startedAt)) return setError('Enter a valid start time.')
    if (!Number.isFinite(mins) || mins <= 0) return setError('Enter a duration in minutes.')
    const final = cleanExercises(
      exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: true })) })),
      lib.cat,
      true,
    )
    if (!final.length) return setError('A workout needs at least one set with values.')
    const prior = recordsByExercise((workouts ?? []).filter((w) => w.id !== workout.id && w.startedAt < startedAt), lib.cat)
    await db.workouts.put({
      ...workout,
      name: name.trim(),
      startedAt,
      endedAt: startedAt + mins * 60000,
      exercises: final,
      prCount: findPRs(final, prior, lib.cat).count,
    })
    onClose()
  }

  return (
    <div className="page sheet-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={close} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">Edit Workout</div>
        <button className="pill-btn blue" onClick={save}>
          Save
        </button>
      </header>
      <SetEditor
        mode="history"
        exercises={exercises}
        update={update}
        previous={previous}
        header={
          <div className="workout-head">
            <input
              className="title-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setDirty(true)
              }}
              aria-label="Workout name"
            />
            <div className="edit-meta">
              <label className="field">
                <span>Start</span>
                <input
                  className="text-input"
                  type="datetime-local"
                  value={start}
                  onChange={(e) => {
                    setStart(e.target.value)
                    setDirty(true)
                  }}
                />
              </label>
              <label className="field narrow">
                <span>Minutes</span>
                <input
                  className="text-input"
                  inputMode="numeric"
                  value={minutes}
                  onChange={(e) => {
                    setMinutes(e.target.value.replace(/\D/g, ''))
                    setDirty(true)
                  }}
                />
              </label>
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        }
      />
    </div>
  )
}
