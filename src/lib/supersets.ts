import type { WExercise } from '../types'
import { uid } from './id'

/** Drop superset ids used by only one exercise. */
export function normalizeSupersets(exs: WExercise[]): WExercise[] {
  const counts = new Map<string, number>()
  for (const e of exs) if (e.supersetId) counts.set(e.supersetId, (counts.get(e.supersetId) ?? 0) + 1)
  return exs.map((e) => (e.supersetId && (counts.get(e.supersetId) ?? 0) < 2 ? { ...e, supersetId: null } : e))
}

export const linkedToNext = (exs: WExercise[], i: number) =>
  !!exs[i].supersetId && exs[i + 1]?.supersetId === exs[i].supersetId

/** Link exercise i with the one after it, or unlink them if already linked. */
export function toggleLinkNext(exs: WExercise[], i: number): WExercise[] {
  if (i >= exs.length - 1) return exs
  const out = exs.map((e) => ({ ...e }))
  if (linkedToNext(out, i)) {
    // split the group after i
    const old = out[i].supersetId!
    const fresh = uid()
    for (let j = i + 1; j < out.length && out[j].supersetId === old; j++) out[j].supersetId = fresh
  } else {
    const a = out[i]
    const b = out[i + 1]
    const id = a.supersetId ?? uid()
    const old = b.supersetId
    a.supersetId = id
    if (old) {
      for (const e of out) if (e.supersetId === old) e.supersetId = id
    } else b.supersetId = id
  }
  return normalizeSupersets(out)
}

/** Move exercise `j` right after exercise `i` and link them. */
export function supersetWith(exs: WExercise[], i: number, j: number): WExercise[] {
  const target = exs[i]
  const moving = exs[j]
  const rest = exs.filter((_, k) => k !== j)
  let at = rest.indexOf(target)
  // skip past target's existing group so the group stays contiguous
  while (target.supersetId && rest[at + 1]?.supersetId === target.supersetId) at++
  rest.splice(at + 1, 0, { ...moving, supersetId: null })
  const id = target.supersetId ?? uid()
  return normalizeSupersets(
    rest.map((e) => (e === target || e.id === moving.id ? { ...e, supersetId: id } : e)),
  )
}

export function removeFromSuperset(exs: WExercise[], i: number): WExercise[] {
  const out = exs.map((e) => ({ ...e }))
  const id = out[i].supersetId
  if (!id) return exs
  out[i].supersetId = null
  // keep group contiguous: move it after the group's last member
  const [moved] = out.splice(i, 1)
  let last = -1
  out.forEach((e, k) => e.supersetId === id && (last = k))
  out.splice(last >= 0 ? last + 1 : i, 0, moved)
  return normalizeSupersets(out)
}

/** Should the rest timer start after a set of exercise i? Only after the last exercise of a superset. */
export function restAfter(exs: WExercise[], i: number): boolean {
  return !linkedToNext(exs, i)
}

const COLORS = ['var(--ss1)', 'var(--ss2)', 'var(--ss3)', 'var(--ss4)']

export function supersetColors(exs: WExercise[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const e of exs) if (e.supersetId && !m.has(e.supersetId)) m.set(e.supersetId, COLORS[m.size % COLORS.length])
  return m
}
