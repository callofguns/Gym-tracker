import { describe, expect, it } from 'vitest'
import type { Template, WExercise, WSet, Workout } from '../types'
import { kgTo, num, toKg } from './units'
import { alignSets, cleanExercises, e1rm, hasValues, placeholdersFor, setLabels, warmupSets } from './sets'
import { findPRs, recordsByExercise } from './records'
import { applyValuesOnly, diffTemplate } from './templateDiff'
import { normalizeSupersets, toggleLinkNext } from './supersets'
import { clock } from './format'

const set = (p: Partial<WSet>): WSet => ({
  id: Math.random().toString(36).slice(2),
  type: 'normal',
  weight: null,
  reps: null,
  distance: null,
  duration: null,
  rest: 90,
  done: false,
  ...p,
})
const cat = () => 'barbell' as const

describe('units', () => {
  it('round-trips pounds through kg without drift', () => {
    expect(num(kgTo(toKg(95, 'lb'), 'lb'))).toBe('95')
    expect(num(kgTo(toKg(137.5, 'lb'), 'lb'))).toBe('137.5')
  })
  it('formats clocks', () => {
    expect(clock(90)).toBe('1:30')
    expect(clock(3725)).toBe('1:02:05')
  })
})

describe('sets', () => {
  it('labels normal sets with numbers and others with letters', () => {
    expect(setLabels([set({ type: 'warmup' }), set({}), set({ type: 'drop' }), set({})])).toEqual(['W', '1', 'D', '2'])
  })
  it('matches warm-ups to warm-ups and working sets to working sets', () => {
    const prev = [set({ weight: 100, reps: 5 }), set({ weight: 100, reps: 4 })]
    const now = [set({ type: 'warmup' }), set({}), set({})]
    const a = alignSets(prev, now)
    expect(a[0]).toBeUndefined()
    expect(a[1]?.reps).toBe(5)
    expect(a[2]?.reps).toBe(4)
  })
  it('falls back to the set above for placeholders', () => {
    const now = [set({ weight: 50, reps: 10 }), set({})]
    const ph = placeholdersFor(now, [], 'barbell')
    expect(ph[1]?.weight).toBe(50)
  })
  it('requires reps and weight for barbell, only reps for weighted bodyweight', () => {
    expect(hasValues(set({ reps: 5 }), 'barbell')).toBe(false)
    expect(hasValues(set({ reps: 5 }), 'weighted_bodyweight')).toBe(true)
  })
  it('builds plate-rounded warm-ups', () => {
    const ws = warmupSets(100, 60, 'kg', (v) => v, (v) => v)
    expect(ws.map((s) => s.weight)).toEqual([40, 60, 80])
    expect(ws.every((s) => s.type === 'warmup')).toBe(true)
  })
  it('drops empty and unfinished sets when cleaning', () => {
    const exs: WExercise[] = [{ id: 'a', exerciseId: 'x', supersetId: null, sets: [set({ weight: 1, reps: 1, done: true }), set({})] }]
    expect(cleanExercises(exs, cat, true)[0].sets).toHaveLength(1)
  })
  it('estimates 1RM with Epley', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(Math.round(e1rm(100, 10))).toBe(133)
  })
})

describe('records', () => {
  const past: Workout = {
    id: 'w1',
    name: 'A',
    startedAt: 1,
    endedAt: 2,
    templateId: null,
    prCount: 0,
    exercises: [{ id: 'e', exerciseId: 'bench', supersetId: null, sets: [set({ weight: 100, reps: 5, done: true })] }],
  }
  it('flags a heavier set as a PR', () => {
    const prior = recordsByExercise([past], cat)
    const s = set({ weight: 105, reps: 5, done: true })
    const r = findPRs([{ id: 'e2', exerciseId: 'bench', supersetId: null, sets: [s] }], prior, cat)
    expect(r.setIds.has(s.id)).toBe(true)
    expect(r.count).toBe(3) // weight, 1RM, volume
  })
  it('ignores warm-ups and first-ever exercises', () => {
    const prior = recordsByExercise([past], cat)
    const w = set({ type: 'warmup', weight: 200, reps: 5, done: true })
    expect(findPRs([{ id: 'e', exerciseId: 'bench', supersetId: null, sets: [w] }], prior, cat).count).toBe(0)
    expect(findPRs([{ id: 'e', exerciseId: 'new', supersetId: null, sets: [set({ weight: 1, reps: 1, done: true })] }], prior, cat).count).toBe(0)
  })
})

describe('template diff', () => {
  const t: Template = {
    id: 't',
    name: 'Push',
    createdAt: 0,
    updatedAt: 0,
    lastUsedAt: null,
    exercises: [{ id: 'e', exerciseId: 'bench', supersetId: null, sets: [set({ weight: 100, reps: 5 }), set({ weight: 100, reps: 5 })] }],
  }
  it('counts value changes and removed sets', () => {
    const done: WExercise[] = [{ id: 'x', exerciseId: 'bench', supersetId: null, sets: [set({ weight: 105, reps: 5, done: true })] }]
    const d = diffTemplate(t, done, cat)
    expect(d.valueChanges).toBe(1)
    expect(d.structural).toContain('Removes 1 set.')
  })
  it('does not treat added warm-ups as value changes', () => {
    const done: WExercise[] = [
      {
        id: 'x',
        exerciseId: 'bench',
        supersetId: null,
        sets: [set({ type: 'warmup', weight: 40, reps: 5 }), set({ weight: 100, reps: 5 }), set({ weight: 100, reps: 5 })],
      },
    ]
    const d = diffTemplate(t, done, cat)
    expect(d.valueChanges).toBe(0)
    expect(d.structural).toEqual(['Adds 1 set.'])
  })
  it('updates values only in place', () => {
    const done: WExercise[] = [{ id: 'x', exerciseId: 'bench', supersetId: null, sets: [set({ weight: 110, reps: 3 })] }]
    const out = applyValuesOnly(t, done, cat)
    expect(out[0].sets).toHaveLength(2)
    expect(out[0].sets[0].weight).toBe(110)
    expect(out[0].sets[1].weight).toBe(100)
  })
})

describe('supersets', () => {
  const ex = (id: string, ss: string | null = null): WExercise => ({ id, exerciseId: id, supersetId: ss, sets: [] })
  it('links and unlinks with the next exercise', () => {
    const linked = toggleLinkNext([ex('a'), ex('b'), ex('c')], 0)
    expect(linked[0].supersetId).toBeTruthy()
    expect(linked[0].supersetId).toBe(linked[1].supersetId)
    expect(linked[2].supersetId).toBeNull()
    const unlinked = toggleLinkNext(linked, 0)
    expect(unlinked.every((e) => e.supersetId === null)).toBe(true)
  })
  it('clears lonely superset ids', () => {
    expect(normalizeSupersets([ex('a', 's'), ex('b')])[0].supersetId).toBeNull()
  })
})
