import type { Workout } from '../types'
import { useExercises } from '../hooks/data'
import { useSettings } from '../stores/settings'
import { fmtLongDate, shortDuration } from '../lib/format'
import { bestSet, fmtSet, workoutVolume } from '../lib/sets'
import { kgTo, num, weightShort } from '../lib/units'
import { IconClockSolid, IconDots, IconTrophy, IconWeight } from './Icons'

export function WorkoutCard({
  workout,
  onMenu,
  onClick,
}: {
  workout: Workout
  onMenu?: (el: Element) => void
  onClick?: () => void
}) {
  const lib = useExercises()
  const wu = useSettings((s) => s.weightUnit)
  const du = useSettings((s) => s.distanceUnit)
  const vol = workoutVolume(workout.exercises, lib.cat)
  const Tag = onClick ? 'button' : 'div'
  return (
    <div className="card workout-card" data-workout={workout.id}>
      <div className="card-head">
        <div className="card-title">{workout.name}</div>
        {onMenu && (
          <button className="chip-icon" aria-label="Workout options" onClick={(e) => onMenu(e.currentTarget)}>
            <IconDots size={20} />
          </button>
        )}
      </div>
      <Tag className="card-body" onClick={onClick}>
        <div className="muted">{fmtLongDate(workout.startedAt)}</div>
        <div className="stats-row">
          <span>
            <IconClockSolid size={18} /> {shortDuration(workout.endedAt - workout.startedAt)}
          </span>
          <span>
            <IconWeight size={18} /> {num(kgTo(vol, wu), 0)} {weightShort(wu)}
          </span>
          <span>
            <IconTrophy size={18} /> {workout.prCount} PR{workout.prCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="best-table">
          <span className="th">Exercise</span>
          <span className="th">Best Set</span>
          {workout.exercises.map((e) => {
            const c = lib.cat(e.exerciseId)
            const b = bestSet(e.sets, c)
            return (
              <div key={e.id} className="best-row">
                <span className="trunc">
                  {e.sets.length} × {lib.get(e.exerciseId).name}
                </span>
                <span className="trunc">{b ? fmtSet(b, c, wu, du) : '—'}</span>
              </div>
            )
          })}
        </div>
      </Tag>
    </div>
  )
}
