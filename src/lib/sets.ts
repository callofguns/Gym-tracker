import type { Category, Field, SetType, WExercise, WSet } from '../types'
import { uid } from './id'
import { clock } from './format'
import { fmtWeight, kmTo, num, type DistanceUnit, type WeightUnit } from './units'

export function fieldsFor(c: Category): Field[] {
  switch (c) {
    case 'reps_only':
      return ['reps']
    case 'cardio':
      return ['distance', 'duration']
    case 'duration':
      return ['duration']
    default:
      return ['weight', 'reps']
  }
}

export const isWeighted = (c: Category) => fieldsFor(c)[0] === 'weight'

/** weight is optional (bodyweight) for these */
const weightOptional = (c: Category) => c === 'weighted_bodyweight' || c === 'assisted_bodyweight'

export function newSet(rest: number, from?: Partial<WSet>): WSet {
  return {
    id: uid(),
    type: from?.type ?? 'normal',
    weight: from?.weight ?? null,
    reps: from?.reps ?? null,
    distance: from?.distance ?? null,
    duration: from?.duration ?? null,
    rest,
    done: false,
  }
}

export function hasValues(s: WSet, c: Category): boolean {
  switch (c) {
    case 'reps_only':
      return !!s.reps
    case 'cardio':
      return !!s.distance || !!s.duration
    case 'duration':
      return !!s.duration
    default:
      return !!s.reps && (weightOptional(c) || s.weight != null)
  }
}

const setKind = (s: WSet) => (s.type === 'warmup' ? 'w' : 'n')

/**
 * Match each set in `sets` to a set in `other` of the same kind (warm-up vs working) at the same
 * position among that kind. So warm-ups line up with last time's warm-ups, and your first working
 * set lines up with last time's first working set, however many warm-ups either has.
 */
export function alignSets(other: WSet[], sets: WSet[]): (WSet | undefined)[] {
  const pools = { w: other.filter((s) => setKind(s) === 'w'), n: other.filter((s) => setKind(s) === 'n') }
  const seen = { w: 0, n: 0 }
  return sets.map((s) => pools[setKind(s)][seen[setKind(s)]++])
}

/** Placeholder values for each set: last workout's matching set, else the nearest set above of the same kind. */
export function placeholdersFor(sets: WSet[], prev: WSet[], c: Category): (WSet | undefined)[] {
  const aligned = alignSets(prev, sets)
  const out: (WSet | undefined)[] = []
  sets.forEach((s, i) => {
    let above: WSet | undefined
    for (let j = i - 1; j >= 0; j--)
      if (setKind(sets[j]) === setKind(s)) {
        above = fillFrom(sets[j], out[j], c)
        break
      }
    out.push(aligned[i] ?? above)
  })
  return out
}

/** Fill empty fields of `s` from placeholder `p` (previous workout or the set above). */
export function fillFrom(s: WSet, p: WSet | undefined, c: Category): WSet {
  if (!p) return s
  const out = { ...s }
  for (const f of fieldsFor(c)) if (out[f] == null && p[f] != null) out[f] = p[f]
  return out
}

export function setVolume(s: WSet, c: Category): number {
  if (!isWeighted(c) || c === 'assisted_bodyweight') return 0
  return (s.weight ?? 0) * (s.reps ?? 0)
}

/** Epley estimated one-rep max. */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function workoutVolume(exs: WExercise[], cat: (id: string) => Category): number {
  let v = 0
  for (const e of exs) {
    const c = cat(e.exerciseId)
    for (const s of e.sets) if (s.done) v += setVolume(s, c)
  }
  return v
}

export function bestSet(sets: WSet[], c: Category): WSet | undefined {
  const done = sets.filter((s) => s.done)
  if (!done.length) return undefined
  const score = (s: WSet) => {
    if (isWeighted(c)) {
      const w = s.weight ?? 0
      return c === 'assisted_bodyweight' ? -w * 1000 + (s.reps ?? 0) : e1rm(w, s.reps ?? 0) * 1000 + (s.reps ?? 0)
    }
    if (c === 'reps_only') return s.reps ?? 0
    if (c === 'cardio') return (s.distance ?? 0) * 100000 + (s.duration ?? 0)
    return s.duration ?? 0
  }
  return done.reduce((a, b) => (score(b) > score(a) ? b : a))
}

export function fmtSet(s: WSet, c: Category, wu: WeightUnit, du: DistanceUnit): string {
  switch (c) {
    case 'reps_only':
      return `${s.reps ?? 0} reps`
    case 'cardio': {
      const parts = []
      if (s.distance) parts.push(`${num(kmTo(s.distance, du))} ${du}`)
      if (s.duration) parts.push(clock(s.duration))
      return parts.join(' | ') || '—'
    }
    case 'duration':
      return clock(s.duration ?? 0)
    case 'weighted_bodyweight':
      return s.weight ? `+${fmtWeight(s.weight, wu)} × ${s.reps ?? 0}` : `${s.reps ?? 0} reps`
    case 'assisted_bodyweight':
      return s.weight ? `-${fmtWeight(s.weight, wu)} × ${s.reps ?? 0}` : `${s.reps ?? 0} reps`
    default:
      return `${fmtWeight(s.weight ?? 0, wu)} × ${s.reps ?? 0}`
  }
}

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: 'Normal Set',
  warmup: 'Warm-up Set',
  drop: 'Drop Set',
  failure: 'Failure Set',
}

export const SET_TYPE_LETTER: Record<SetType, string> = { normal: '', warmup: 'W', drop: 'D', failure: 'F' }

/** Labels shown in the "Set" column: normal sets are numbered, others show a letter. */
export function setLabels(sets: WSet[]): string[] {
  let n = 0
  return sets.map((s) => (s.type === 'normal' ? String(++n) : SET_TYPE_LETTER[s.type]))
}

/** Warm-up sets at 40%, 60% and 80% of a working weight (kg), rounded to plates in the display unit. */
export function warmupSets(workingKg: number, rest: number, unit: WeightUnit, toKg: (v: number) => number, fromKg: (v: number) => number): WSet[] {
  const step = unit === 'kg' ? 2.5 : 5
  const scheme: [number, number][] = [
    [0.4, 5],
    [0.6, 3],
    [0.8, 2],
  ]
  return scheme.map(([pct, reps]) => {
    const disp = Math.max(step, Math.round((fromKg(workingKg) * pct) / step) * step)
    return newSet(rest, { type: 'warmup', weight: toKg(disp), reps })
  })
}

/** Remove sets without values; optionally keep only done sets. */
export function cleanExercises(exs: WExercise[], cat: (id: string) => Category, onlyDone: boolean): WExercise[] {
  return exs
    .map((e) => ({
      ...e,
      sets: e.sets.filter((s) => hasValues(s, cat(e.exerciseId)) && (!onlyDone || s.done)),
    }))
    .filter((e) => e.sets.length > 0)
}
