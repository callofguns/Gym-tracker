import type { Category, Template, WExercise } from '../types'
import { alignSets, fieldsFor, newSet } from './sets'
import { uid } from './id'

export interface TemplateDiff {
  /** Number of sets (at matching positions) whose values changed. */
  valueChanges: number
  /** Human summary of structural changes, empty if none. */
  structural: string[]
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

export function diffTemplate(t: Template, done: WExercise[], cat: (id: string) => Category): TemplateDiff {
  const structural: string[] = []
  let valueChanges = 0

  const tIds = t.exercises.map((e) => e.exerciseId)
  const wIds = done.map((e) => e.exerciseId)
  const addedEx = wIds.filter((id) => !tIds.includes(id)).length
  const removedEx = tIds.filter((id) => !wIds.includes(id)).length
  if (addedEx) structural.push(`Adds ${plural(addedEx, 'exercise')}.`)
  if (removedEx) structural.push(`Removes ${plural(removedEx, 'exercise')}.`)
  const common = wIds.filter((id) => tIds.includes(id))
  const tCommon = tIds.filter((id) => wIds.includes(id))
  if (common.join() !== tCommon.join()) structural.push('Reorders exercises.')

  let addedSets = 0
  let removedSets = 0
  let restChanged = false
  let typeChanged = false
  let supersetChanged = false
  for (const we of done) {
    const te = t.exercises.find((e) => e.exerciseId === we.exerciseId)
    if (!te) continue
    const diff = we.sets.length - te.sets.length
    if (diff > 0) addedSets += diff
    if (diff < 0) removedSets -= diff
    if (!!we.supersetId !== !!te.supersetId) supersetChanged = true
    const fields = fieldsFor(cat(we.exerciseId))
    const matched = alignSets(te.sets, we.sets)
    we.sets.forEach((s, i) => {
      const ts = matched[i]
      if (!ts) return
      if (s.rest !== ts.rest) restChanged = true
      if (s.type !== ts.type) typeChanged = true
      if (fields.some((f) => (s[f] ?? null) !== (ts[f] ?? null))) valueChanges++
    })
  }
  if (addedSets) structural.push(`Adds ${plural(addedSets, 'set')}.`)
  if (removedSets) structural.push(`Removes ${plural(removedSets, 'set')}.`)
  if (typeChanged) structural.push('Updates set types.')
  if (supersetChanged) structural.push('Updates supersets.')
  if (restChanged) structural.push('Updates rest timers.')
  return { valueChanges, structural }
}

/** Copy values of matching sets into the template, keeping its structure. */
export function applyValuesOnly(t: Template, done: WExercise[], cat: (id: string) => Category): WExercise[] {
  return t.exercises.map((te) => {
    const we = done.find((e) => e.exerciseId === te.exerciseId)
    if (!we) return te
    const fields = fieldsFor(cat(te.exerciseId))
    const matched = alignSets(we.sets, te.sets)
    return {
      ...te,
      sets: te.sets.map((ts, i) => {
        const s = matched[i]
        if (!s) return ts
        const out = { ...ts }
        for (const f of fields) out[f] = s[f]
        return out
      }),
    }
  })
}

/** Replace the template with the workout's structure and values. */
export function workoutToTemplateExercises(exs: WExercise[]): WExercise[] {
  const ssMap = new Map<string, string>()
  return exs.map((e) => ({
    id: uid(),
    exerciseId: e.exerciseId,
    supersetId: e.supersetId ? (ssMap.get(e.supersetId) ?? ssMap.set(e.supersetId, uid()).get(e.supersetId)!) : null,
    sets: e.sets.map((s) => newSet(s.rest, { ...s })),
  }))
}
