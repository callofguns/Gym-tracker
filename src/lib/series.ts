import type { Category, Workout } from '../types'
import { e1rm, isWeighted, setVolume } from './sets'
import { fmtShortMD, startOfWeek } from './format'
import type { Point } from '../components/Charts'

export type ExerciseMetric = '1rm' | 'best' | 'volume' | 'reps' | 'duration' | 'distance'

/** One point per workout for an exercise, oldest first. */
export function exerciseSeries(workouts: Workout[], exerciseId: string, c: Category, metric: ExerciseMetric): Point[] {
  const pts: Point[] = []
  for (const w of [...workouts].sort((a, b) => a.startedAt - b.startedAt)) {
    const sets = w.exercises
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => e.sets)
      .filter((s) => s.done && s.type !== 'warmup')
    if (!sets.length) continue
    let v = 0
    for (const s of sets) {
      if (metric === '1rm' && isWeighted(c)) v = Math.max(v, e1rm(s.weight ?? 0, s.reps ?? 0))
      else if (metric === 'best' && isWeighted(c)) v = Math.max(v, s.weight ?? 0)
      else if (metric === 'volume') v += setVolume(s, c)
      else if (metric === 'reps') v = Math.max(v, s.reps ?? 0)
      else if (metric === 'duration') v = Math.max(v, s.duration ?? 0)
      else if (metric === 'distance') v = Math.max(v, s.distance ?? 0)
    }
    if (v > 0) pts.push({ t: w.startedAt, v })
  }
  return pts
}

/** Last `n` Monday-based weeks, oldest first. */
export function weekBuckets(workouts: Workout[], n: number, value: (w: Workout) => number, now = Date.now()) {
  const thisWeek = startOfWeek(now)
  const weeks = Array.from({ length: n }, (_, i) => {
    const d = new Date(thisWeek)
    d.setDate(d.getDate() - 7 * (n - 1 - i))
    return d.getTime()
  })
  const vals = weeks.map(() => 0)
  for (const w of workouts) {
    const ws = startOfWeek(w.startedAt)
    const i = weeks.indexOf(ws)
    if (i >= 0) vals[i] += value(w)
  }
  return weeks.map((t, i) => ({ label: fmtShortMD(t), value: vals[i] }))
}
