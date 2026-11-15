import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useExercises } from '../hooks/data'
import { useSettings } from '../stores/settings'
import { IconClose, IconClockSolid, IconDots, IconTrophy, IconWeight } from '../components/Icons'
import { MuscleIcon } from '../components/MuscleIcon'
import { fmtLongDate, shortDuration } from '../lib/format'
import { fmtSet, setLabels, workoutVolume } from '../lib/sets'
import { kgTo, num, weightShort } from '../lib/units'
import { workoutMenu } from '../lib/workoutActions'

export function WorkoutDetail({ workoutId, onClose }: { workoutId: string; onClose: () => void }) {
  const w = useLiveQuery(() => db.workouts.get(workoutId), [workoutId])
  const lib = useExercises()
  const wu = useSettings((s) => s.weightUnit)
  const du = useSettings((s) => s.distanceUnit)
  if (w === undefined) return null
  if (w === null) return null

  const vol = workoutVolume(w.exercises, lib.cat)
  return (
    <div className="page sheet-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">{w.name}</div>
        <button className="icon-btn" aria-label="Workout options" onClick={(e) => workoutMenu(e.currentTarget, w, onClose)}>
          <IconDots size={22} />
        </button>
      </header>
      <div className="page-scroll">
        <h1 className="page-title small">{w.name}</h1>
        <p className="muted">
          {fmtLongDate(w.startedAt)} ·{' '}
          {new Date(w.startedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </p>
        <div className="stats-row big">
          <span>
            <IconClockSolid size={18} /> {shortDuration(w.endedAt - w.startedAt)}
          </span>
          <span>
            <IconWeight size={18} /> {num(kgTo(vol, wu), 0)} {weightShort(wu)}
          </span>
          <span>
            <IconTrophy size={18} /> {w.prCount} PR{w.prCount === 1 ? '' : 's'}
          </span>
        </div>
        {w.exercises.map((e) => {
          const ex = lib.get(e.exerciseId)
          const labels = setLabels(e.sets)
          return (
            <div key={e.id} className="card">
              <div className="detail-ex-head">
                <MuscleIcon muscle={ex.muscle} size={36} />
                <span className="card-title">{ex.name}</span>
              </div>
              <div className="set-list">
                {e.sets.map((s, i) => (
                  <div key={s.id} className="set-line">
                    <span className={`set-tag${s.type !== 'normal' ? ' t-' + s.type : ''}`}>{labels[i]}</span>
                    <span>{fmtSet(s, ex.category, wu, du)}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
