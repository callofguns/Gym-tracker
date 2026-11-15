import { useEffect, useMemo } from 'react'
import { useWorkouts } from '../hooks/data'
import { useUI } from '../stores/ui'
import { WorkoutCard } from '../components/WorkoutCard'
import { fmtMonthHeader } from '../lib/format'
import { workoutMenu } from '../lib/workoutActions'
import type { Workout } from '../types'

export function History() {
  const workouts = useWorkouts()
  const push = useUI((s) => s.push)
  const target = useUI((s) => s.scrollToWorkout)

  const months = useMemo(() => {
    const m = new Map<string, Workout[]>()
    for (const w of workouts ?? []) {
      const k = fmtMonthHeader(w.startedAt)
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(w)
    }
    return [...m.entries()]
  }, [workouts])

  useEffect(() => {
    if (!target) return
    const el = document.querySelector(`[data-workout="${target}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el?.classList.add('flash')
    setTimeout(() => el?.classList.remove('flash'), 1200)
    useUI.getState().setScrollToWorkout(null)
  }, [target])

  return (
    <div className="tab-page">
      <div className="top-actions right">
        <button className="text-btn" onClick={() => push({ kind: 'calendar' })}>
          Calendar
        </button>
      </div>
      <h1 className="page-title">History</h1>
      {workouts && workouts.length === 0 && (
        <p className="empty">No workouts yet. Finish a workout and it will appear here.</p>
      )}
      {months.map(([month, list]) => (
        <section key={month}>
          <h2 className="month-head">{month}</h2>
          {list.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              onMenu={(el) => workoutMenu(el, w)}
              onClick={() => push({ kind: 'workoutDetail', workoutId: w.id })}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
