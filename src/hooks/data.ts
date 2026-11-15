import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { BUILT_IN_EXERCISES } from '../data/exercises'
import type { Category, Exercise, WSet, Workout } from '../types'

const EMPTY: never[] = []

export interface ExerciseLib {
  list: Exercise[]
  byId: Map<string, Exercise>
  get: (id: string) => Exercise
  cat: (id: string) => Category
}

const unknown = (id: string): Exercise => ({
  id,
  name: 'Unknown Exercise',
  bodyPart: 'other',
  category: 'machine',
  muscle: 'full_body',
})

export function useExercises(): ExerciseLib {
  const custom = useLiveQuery(() => db.customExercises.toArray(), []) ?? EMPTY
  return useMemo(() => {
    const byId = new Map<string, Exercise>()
    for (const e of BUILT_IN_EXERCISES) byId.set(e.id, e)
    for (const e of custom) byId.set(e.id, e)
    const list = [...byId.values()]
      .filter((e) => !e.archived)
      .sort((a, b) => a.name.localeCompare(b.name))
    const get = (id: string) => byId.get(id) ?? unknown(id)
    return { list, byId, get, cat: (id: string) => get(id).category }
  }, [custom])
}

/** All finished workouts, newest first. */
export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(() => db.workouts.orderBy('startedAt').reverse().toArray(), [])
}

/**
 * Sets from the most recent workout containing each exercise (before `before`, if given,
 * and excluding workout `excludeId`).
 */
export function usePreviousSets(before?: number, excludeId?: string): Map<string, WSet[]> {
  const workouts = useWorkouts()
  return useMemo(() => {
    const m = new Map<string, WSet[]>()
    for (const w of workouts ?? []) {
      if (excludeId && w.id === excludeId) continue
      if (before != null && w.startedAt >= before) continue
      for (const e of w.exercises) if (!m.has(e.exerciseId)) m.set(e.exerciseId, e.sets)
    }
    return m
  }, [workouts, before, excludeId])
}
