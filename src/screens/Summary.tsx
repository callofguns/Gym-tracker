import { useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useExercises } from '../hooks/data'
import { WorkoutCard } from '../components/WorkoutCard'
import { IconClose, IconStar } from '../components/Icons'
import { confirmDialog } from '../components/overlay'
import { ordinal } from '../lib/format'
import { applyValuesOnly, diffTemplate, workoutToTemplateExercises } from '../lib/templateDiff'

const TITLES = ['Congratulations!', 'Great Job!', 'Well Done!', 'Nice Work!']

export function Summary({ workoutId, templateId, onClose }: { workoutId: string; templateId: string | null; onClose: () => void }) {
  const lib = useExercises()
  const workout = useLiveQuery(() => db.workouts.get(workoutId), [workoutId])
  const count = useLiveQuery(() => db.workouts.count(), [])
  const title = useMemo(() => TITLES[Math.floor(Math.random() * TITLES.length)], [])
  const asked = useRef(false)

  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 2.5,
        dur: 3 + Math.random() * 3,
        size: 10 + Math.random() * 18,
        key: i,
      })),
    [],
  )

  // Offer to update the template this workout came from.
  useEffect(() => {
    if (!workout || !templateId || asked.current) return
    asked.current = true
    void (async () => {
      const t = await db.templates.get(templateId)
      if (!t) return
      const diff = diffTemplate(t, workout.exercises, lib.cat)
      if (!diff.valueChanges && !diff.structural.length) return
      const n = diff.valueChanges
      const choice = await confirmDialog({
        title: 'Update Template',
        message: "You've made changes from your original template. Would you like to update it?",
        buttons: [
          ...(n
            ? [{ label: 'Update Values Only', sub: `Updates values for ${n} set${n === 1 ? '' : 's'}.`, variant: 'blue' as const, value: 'values' as const }]
            : []),
          ...(diff.structural.length
            ? [{ label: 'Update Template and Values', sub: diff.structural.join(' '), variant: 'red' as const, value: 'all' as const }]
            : []),
          { label: 'Keep Original Template', variant: 'plain' as const, value: null },
        ],
      })
      if (choice === 'values') await db.templates.update(t.id, { exercises: applyValuesOnly(t, workout.exercises, lib.cat), updatedAt: Date.now() })
      if (choice === 'all') await db.templates.update(t.id, { exercises: workoutToTemplateExercises(workout.exercises), updatedAt: Date.now() })
    })()
  }, [workout, templateId, lib.cat])

  return (
    <div className="page summary-page">
      <div className="star-field" aria-hidden="true">
        {stars.map((s) => (
          <span
            key={s.key}
            className="falling-star"
            style={{ left: `${s.left}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`, width: s.size, height: s.size }}
          >
            <IconStar size={s.size} />
          </span>
        ))}
      </div>
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
      </header>
      <div className="summary-body">
        <div className="trophy-stars">
          <IconStar size={44} className="star-sm" />
          <IconStar size={64} className="star-lg" />
          <IconStar size={44} className="star-sm" />
        </div>
        <h1 className="summary-title">{title}</h1>
        {count != null && <p className="muted center">That’s your {ordinal(count)} workout!</p>}
        <div className="summary-card">{workout && <WorkoutCard workout={workout} />}</div>
      </div>
    </div>
  )
}
