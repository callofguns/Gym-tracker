import type { Category, WExercise, WSet, Workout } from '../types'
import { e1rm, isWeighted, setVolume } from './sets'

export interface Records {
  maxWeight: number
  maxE1rm: number
  maxVolume: number
  maxReps: number
  maxDuration: number
  maxDistance: number
}

export const emptyRecords = (): Records => ({
  maxWeight: 0,
  maxE1rm: 0,
  maxVolume: 0,
  maxReps: 0,
  maxDuration: 0,
  maxDistance: 0,
})

const counts = (s: WSet) => s.done && s.type !== 'warmup'

function apply(r: Records, s: WSet, c: Category) {
  if (!counts(s)) return
  if (isWeighted(c) && c !== 'assisted_bodyweight') {
    const w = s.weight ?? 0
    const reps = s.reps ?? 0
    if (reps > 0) {
      r.maxWeight = Math.max(r.maxWeight, w)
      r.maxE1rm = Math.max(r.maxE1rm, e1rm(w, reps))
      r.maxVolume = Math.max(r.maxVolume, setVolume(s, c))
    }
  }
  r.maxReps = Math.max(r.maxReps, s.reps ?? 0)
  r.maxDuration = Math.max(r.maxDuration, s.duration ?? 0)
  r.maxDistance = Math.max(r.maxDistance, s.distance ?? 0)
}

/** Records per exercise from a list of workouts. */
export function recordsByExercise(workouts: Workout[], cat: (id: string) => Category): Map<string, Records> {
  const m = new Map<string, Records>()
  for (const w of workouts)
    for (const e of w.exercises) {
      let r = m.get(e.exerciseId)
      if (!r) m.set(e.exerciseId, (r = emptyRecords()))
      const c = cat(e.exerciseId)
      for (const s of e.sets) apply(r, s, c)
    }
  return m
}

/**
 * Which sets in `exs` beat the prior records (and every earlier set in this workout),
 * and how many record types were broken in total. Only exercises with history count,
 * so a first-ever session doesn't flood you with PRs.
 */
export function findPRs(exs: WExercise[], prior: Map<string, Records>, cat: (id: string) => Category) {
  const setIds = new Set<string>()
  let count = 0
  for (const e of exs) {
    const base = prior.get(e.exerciseId)
    if (!base) continue
    const c = cat(e.exerciseId)
    const cur: Records = { ...base }
    const broken = new Set<keyof Records>()
    for (const s of e.sets) {
      if (!counts(s)) continue
      const before = { ...cur }
      apply(cur, s, c)
      const keys: (keyof Records)[] = isWeighted(c)
        ? c === 'assisted_bodyweight'
          ? []
          : ['maxWeight', 'maxE1rm', 'maxVolume']
        : c === 'reps_only'
          ? ['maxReps']
          : c === 'cardio'
            ? ['maxDistance', 'maxDuration']
            : ['maxDuration']
      let isPr = false
      for (const k of keys)
        if (cur[k] > before[k] && before[k] > 0) {
          broken.add(k)
          isPr = true
        }
      if (isPr) setIds.add(s.id)
    }
    count += broken.size
  }
  return { setIds, count }
}
