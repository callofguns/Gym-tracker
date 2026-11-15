import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Category, Field, WExercise, WSet } from '../types'
import { useExercises } from '../hooks/data'
import { useSettings } from '../stores/settings'
import { timerRemaining, useWorkout } from '../stores/workout'
import { useUI } from '../stores/ui'
import { useNow } from '../hooks/useNow'
import { clock } from '../lib/format'
import { kgTo, kmTo, num, toKg, toKm, weightLabel } from '../lib/units'
import {
  SET_TYPE_LABEL,
  fieldsFor,
  fillFrom,
  fmtSet,
  hasValues,
  isWeighted,
  newSet,
  placeholdersFor,
  alignSets,
  setLabels,
  warmupSets,
} from '../lib/sets'
import { linkedToNext, removeFromSuperset, restAfter, supersetColors, supersetWith, toggleLinkNext } from '../lib/supersets'
import { unlockAudio } from '../lib/sound'
import { uid } from '../lib/id'
import { Keypad } from './Keypad'
import { RestPanel } from './RestPanel'
import { SwipeRow } from './SwipeRow'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseDetail } from '../screens/ExerciseDetail'
import { openMenu, pickRest } from './overlay'
import {
  IconCheck,
  IconDots,
  IconLink,
  IconReplace,
  IconSuperset,
  IconTimer,
  IconTrophy,
  IconWarmup,
  IconX,
} from './Icons'

export type EditorMode = 'workout' | 'template' | 'history'

interface Props {
  mode: EditorMode
  exercises: WExercise[]
  update: (fn: (exs: WExercise[]) => WExercise[]) => void
  previous: Map<string, WSet[]>
  prSetIds?: Set<string>
  header?: ReactNode
  footer?: ReactNode
  restPanelOpen?: boolean
  setRestPanelOpen?: (o: boolean) => void
  onScroll?: (top: number) => void
}

interface Focus {
  setId: string
  field: Field
}

function rawValue(v: number | null, f: Field, wu: 'kg' | 'lb', du: 'km' | 'mi'): string {
  if (v == null) return ''
  switch (f) {
    case 'weight':
      return num(kgTo(v, wu), 2)
    case 'distance':
      return num(kmTo(v, du), 2)
    case 'reps':
      return String(v)
    case 'duration':
      return clock(v).replace(/:/g, '').replace(/^0+/, '')
  }
}

function display(v: number | null, f: Field, wu: 'kg' | 'lb', du: 'km' | 'mi'): string {
  if (v == null) return ''
  if (f === 'duration') return clock(v)
  return rawValue(v, f, wu, du)
}

function parse(b: string, f: Field, wu: 'kg' | 'lb', du: 'km' | 'mi'): number | null {
  if (!b) return null
  if (f === 'duration') {
    const d = b.padStart(6, '0')
    const h = Number(d.slice(0, -4))
    const m = Number(d.slice(-4, -2))
    const s = Number(d.slice(-2))
    return h * 3600 + m * 60 + s
  }
  const n = f === 'reps' ? parseInt(b, 10) : parseFloat(b)
  if (!Number.isFinite(n)) return null
  if (f === 'weight') return toKg(n, wu)
  if (f === 'distance') return toKm(n, du)
  return n
}

function columnLabel(f: Field, c: Category, wu: 'kg' | 'lb', du: 'km' | 'mi') {
  if (f === 'weight') {
    const u = weightLabel(wu)
    if (c === 'weighted_bodyweight') return `+${u}`
    if (c === 'assisted_bodyweight') return `-${u}`
    return u
  }
  if (f === 'reps') return 'Reps'
  if (f === 'distance') return du
  return 'Time'
}

export function SetEditor({
  mode,
  exercises,
  update,
  previous,
  prSetIds,
  header,
  footer,
  restPanelOpen = false,
  setRestPanelOpen,
  onScroll,
}: Props) {
  const lib = useExercises()
  const wu = useSettings((s) => s.weightUnit)
  const du = useSettings((s) => s.distanceUnit)
  const defaultRest = useSettings((s) => s.defaultRest)
  const timer = useWorkout((s) => s.timer)
  const showToast = useUI((s) => s.showToast)

  const [focus, setFocus] = useState<Focus | null>(null)
  const [buffer, setBuffer] = useState('')
  const [fresh, setFresh] = useState(true)
  const [shake, setShake] = useState<string | null>(null)
  const [picker, setPicker] = useState<{ mode: 'add' } | { mode: 'replace'; idx: number } | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const checks = mode === 'workout'
  const ssColors = supersetColors(exercises)

  // Close keypad when the rest panel opens, and keep the running rest bar in view.
  useEffect(() => {
    if (!restPanelOpen) return
    setFocus(null)
    requestAnimationFrame(() =>
      scrollRef.current?.querySelector('.rest-bar.running')?.scrollIntoView({ block: 'center', behavior: 'smooth' }),
    )
  }, [restPanelOpen])
  // Rest panel closes itself when the timer ends.
  useEffect(() => {
    if (!timer && restPanelOpen) setRestPanelOpen?.(false)
  }, [timer, restPanelOpen, setRestPanelOpen])

  /** Placeholder (grey) values for each set. */
  const placeholders = (e: WExercise) => placeholdersFor(e.sets, previous.get(e.exerciseId) ?? [], lib.cat(e.exerciseId))

  const patchSet = (setId: string, patch: Partial<WSet>) =>
    update((exs) => exs.map((e) => ({ ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) })))

  const setSets = (exId: string, fn: (sets: WSet[]) => WSet[]) =>
    update((exs) => exs.map((e) => (e.id === exId ? { ...e, sets: fn(e.sets) } : e)))

  const findSet = (setId: string) => {
    for (const e of exercises) {
      const s = e.sets.find((x) => x.id === setId)
      if (s) return { e, s }
    }
    return null
  }

  // ---------- keypad ----------
  const focusCell = (s: WSet, f: Field) => {
    setRestPanelOpen?.(false)
    setFocus({ setId: s.id, field: f })
    setBuffer(rawValue(s[f], f, wu, du))
    setFresh(true)
  }

  const commit = (b: string) => {
    if (!focus) return
    setBuffer(b)
    setFresh(false)
    patchSet(focus.setId, { [focus.field]: parse(b, focus.field, wu, du) })
  }

  const onKey = (k: string) => {
    if (!focus) return
    let b = fresh ? '' : buffer
    if (k === '.') {
      if (b.includes('.')) return
      b = (b || '0') + '.'
    } else {
      if (b === '0') b = ''
      b += k
    }
    if (b.replace('.', '').length > (focus.field === 'duration' ? 6 : 6)) return
    commit(b)
  }

  const onBackspace = () => {
    if (!focus) return
    commit((fresh ? buffer : buffer).slice(0, -1))
  }

  const onStep = (dir: 1 | -1) => {
    if (!focus) return
    const found = findSet(focus.setId)
    if (!found) return
    const idx = found.e.sets.indexOf(found.s)
    const ph = placeholders(found.e)[idx]
    const cur = found.s[focus.field] ?? ph?.[focus.field] ?? 0
    const f = focus.field
    let next: number
    if (f === 'weight') {
      const step = wu === 'kg' ? 2.5 : 5
      next = toKg(Math.max(0, Math.round((kgTo(cur, wu) + dir * step) * 100) / 100), wu)
    } else if (f === 'distance') {
      next = toKm(Math.max(0, Math.round((kmTo(cur, du) + dir * 0.1) * 100) / 100), du)
    } else if (f === 'duration') next = Math.max(0, cur + dir * 15)
    else next = Math.max(0, cur + dir)
    patchSet(focus.setId, { [f]: next })
    setBuffer(rawValue(next, f, wu, du))
    setFresh(true)
  }

  const cells: Focus[] = exercises.flatMap((e) =>
    e.sets.flatMap((s) => fieldsFor(lib.cat(e.exerciseId)).map((field) => ({ setId: s.id, field }))),
  )
  const focusIndex = focus ? cells.findIndex((c) => c.setId === focus.setId && c.field === focus.field) : -1

  const onNext = () => {
    const next = cells[focusIndex + 1]
    if (!next) return setFocus(null)
    const found = findSet(next.setId)
    if (found) focusCell(found.s, next.field)
    requestAnimationFrame(() =>
      document.querySelector(`[data-cell="${next.setId}-${next.field}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    )
  }

  // ---------- set actions ----------
  const toggleDone = (exIdx: number, s: WSet, ph: WSet | undefined) => {
    const e = exercises[exIdx]
    const c = lib.cat(e.exerciseId)
    unlockAudio()
    if (s.done) {
      patchSet(s.id, { done: false })
      if (timer?.setId === s.id) useWorkout.getState().clearTimer()
      return
    }
    const filled = fillFrom(s, ph, c)
    if (!hasValues(filled, c)) {
      setShake(s.id)
      setTimeout(() => setShake(null), 450)
      return
    }
    patchSet(s.id, { ...filled, done: true })
    if (focus?.setId === s.id) setFocus(null)
    if (s.rest > 0 && restAfter(exercises, exIdx)) useWorkout.getState().startTimer(s.rest, s.id)
  }

  const addSet = (e: WExercise) => {
    const last = e.sets[e.sets.length - 1]
    setSets(e.id, (sets) => [...sets, newSet(last?.rest ?? defaultRest)])
  }

  const deleteSet = (e: WExercise, s: WSet) => {
    if (focus?.setId === s.id) setFocus(null)
    if (timer?.setId === s.id) useWorkout.getState().clearTimer()
    setSets(e.id, (sets) => sets.filter((x) => x.id !== s.id))
  }

  const setTypeMenu = (el: Element, s: WSet) =>
    openMenu(
      el,
      (['normal', 'warmup', 'drop', 'failure'] as const).map((t) => ({
        label: SET_TYPE_LABEL[t],
        checked: s.type === t,
        onClick: () => patchSet(s.id, { type: t }),
      })),
    )

  const editRest = async (s: WSet) => {
    const v = await pickRest('Rest Timer', s.rest)
    if (v != null) patchSet(s.id, { rest: v })
  }

  const exerciseMenu = (el: Element, idx: number) => {
    const e = exercises[idx]
    const c = lib.cat(e.exerciseId)
    const others = exercises.map((x, j) => ({ x, j })).filter(({ j }) => j !== idx)
    openMenu(el, [
      ...(isWeighted(c) && c !== 'assisted_bodyweight'
        ? [
            {
              label: 'Add Warm-up Sets',
              icon: <IconWarmup size={20} />,
              onClick: () => {
                const phs = placeholders(e)
                const firstIdx = e.sets.findIndex((s) => s.type === 'normal')
                const base = firstIdx >= 0 ? (e.sets[firstIdx].weight ?? phs[firstIdx]?.weight) : null
                if (!base) return showToast('Enter a weight for your first working set first.')
                const ws = warmupSets(base, e.sets[firstIdx]?.rest ?? defaultRest, wu, (v) => toKg(v, wu), (v) => kgTo(v, wu))
                setSets(e.id, (sets) => [...ws, ...sets])
              },
            },
          ]
        : []),
      {
        label: 'Update Rest Timers',
        icon: <IconTimer size={20} />,
        onClick: async () => {
          const v = await pickRest('Rest Timers', e.sets[0]?.rest ?? defaultRest)
          if (v != null) setSets(e.id, (sets) => sets.map((s) => ({ ...s, rest: v })))
        },
      },
      { label: 'Replace Exercise', icon: <IconReplace size={20} />, onClick: () => setPicker({ mode: 'replace', idx }) },
      e.supersetId
        ? {
            label: 'Remove From Superset',
            icon: <IconSuperset size={20} />,
            onClick: () => update((exs) => removeFromSuperset(exs, exs.findIndex((x) => x.id === e.id))),
          }
        : {
            label: 'Create Superset',
            icon: <IconSuperset size={20} />,
            onClick: () => {
              if (!others.length) return showToast('Add another exercise to create a superset.')
              setTimeout(
                () =>
                  openMenu(
                    el,
                    others.map(({ x }) => ({
                      label: lib.get(x.exerciseId).name,
                      onClick: () =>
                        update((exs) =>
                          supersetWith(
                            exs,
                            exs.findIndex((y) => y.id === e.id),
                            exs.findIndex((y) => y.id === x.id),
                          ),
                        ),
                    })),
                  ),
                0,
              )
            },
          },
      {
        label: 'Remove Exercise',
        icon: <IconX size={20} />,
        danger: true,
        onClick: () => {
          if (focus && e.sets.some((s) => s.id === focus.setId)) setFocus(null)
          update((exs) => exs.filter((x) => x.id !== e.id))
        },
      },
    ])
  }

  const onPicked = (ids: string[]) => {
    const p = picker
    setPicker(null)
    if (!p) return
    if (p.mode === 'add') {
      update((exs) => [
        ...exs,
        ...ids.map((exerciseId) => ({ id: uid(), exerciseId, supersetId: null, sets: [newSet(defaultRest)] })),
      ])
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }))
    } else {
      update((exs) =>
        exs.map((e, i) =>
          i === p.idx
            ? { ...e, exerciseId: ids[0], sets: e.sets.map((s) => newSet(s.rest, { type: s.type })) }
            : e,
        ),
      )
    }
  }

  const focusedField = focus?.field
  const keypadOpen = !!focus && !restPanelOpen

  return (
    <div className="editor">
      <div className="editor-scroll" ref={scrollRef} onScroll={(e) => onScroll?.((e.target as HTMLElement).scrollTop)}>
        {header}
        {exercises.map((e, idx) => {
          const ex = lib.get(e.exerciseId)
          const c = ex.category
          const fields = fieldsFor(c)
          const prev = alignSets(previous.get(e.exerciseId) ?? [], e.sets)
          const phs = placeholders(e)
          const labels = setLabels(e.sets)
          const linked = linkedToNext(exercises, idx)
          const ssColor = e.supersetId ? ssColors.get(e.supersetId) : undefined
          const cols = `cols-${fields.length}${checks ? ' with-check' : ''}`
          const nextRest = e.sets[e.sets.length - 1]?.rest ?? defaultRest
          return (
            <section
              key={e.id}
              className={`ex-block${ssColor ? ' in-superset' : ''}${linked ? ' linked' : ''}`}
              style={ssColor ? ({ '--ss': ssColor } as React.CSSProperties) : undefined}
            >
              <div className="ex-head">
                <button className="ex-title" onClick={() => setDetailId(e.exerciseId)}>
                  {ex.name}
                </button>
                <button
                  className={`chip-icon${linked ? ' on' : ''}`}
                  aria-label={linked ? 'Unlink superset' : 'Superset with next exercise'}
                  aria-pressed={linked}
                  onClick={() =>
                    idx === exercises.length - 1
                      ? showToast('Add another exercise below to superset with.')
                      : update((exs) => toggleLinkNext(exs, idx))
                  }
                >
                  <IconLink size={20} />
                </button>
                <button className="chip-icon" aria-label="Exercise options" onClick={(ev) => exerciseMenu(ev.currentTarget, idx)}>
                  <IconDots size={20} />
                </button>
              </div>
              {ssColor && <div className="ss-label">Superset</div>}

              <div className={`set-grid head ${cols}`}>
                <span>Set</span>
                <span className="prev-col">Previous</span>
                {fields.map((f) => (
                  <span key={f} className="val-col">
                    {columnLabel(f, c, wu, du)}
                  </span>
                ))}
                {checks && (
                  <span className="check-col">
                    <IconCheck size={20} />
                  </span>
                )}
              </div>

              {e.sets.map((s, i) => {
                const ph = phs[i]
                const prevSet = prev[i]
                const empty = fields.some((f) => s[f] == null)
                const typeClass = s.type !== 'normal' ? ` t-${s.type}` : ''
                const isPr = prSetIds?.has(s.id)
                return (
                  <div key={s.id} className="set-wrap">
                    <SwipeRow onDelete={() => deleteSet(e, s)} className={s.done && checks ? 'done' : ''}>
                      <div className={`set-grid row ${cols}${s.done && checks ? ' done' : ''}${shake === s.id ? ' shake' : ''}`}>
                        <button className={`set-num${typeClass}`} onClick={(ev) => setTypeMenu(ev.currentTarget, s)} aria-label={`Set ${labels[i]} type`}>
                          {labels[i]}
                        </button>
                        <button
                          className={`prev-col prev-text${empty && !s.done && prevSet ? ' hot' : ''}`}
                          onClick={() => {
                            if (!prevSet) return
                            const patch: Partial<WSet> = {}
                            for (const f of fields) patch[f] = prevSet[f]
                            patchSet(s.id, patch)
                          }}
                          disabled={!prevSet}
                        >
                          {prevSet ? fmtSet(prevSet, c, wu, du) : '—'}
                          {isPr && (
                            <span className="pr-badge" title="Personal record">
                              <IconTrophy size={14} />
                            </span>
                          )}
                        </button>
                        {fields.map((f) => {
                          const focused = focus?.setId === s.id && focus.field === f && keypadOpen
                          const val =
                            focused && !fresh && f !== 'duration'
                              ? buffer
                              : focused && !fresh && f === 'duration'
                                ? clock(s[f] ?? 0)
                                : display(s[f], f, wu, du)
                          return (
                            <button
                              key={f}
                              data-cell={`${s.id}-${f}`}
                              className={`val-col cell${focused ? ' focused' : ''}${val ? '' : ' ph'}`}
                              onClick={() => focusCell(s, f)}
                            >
                              {val || display(ph?.[f] ?? null, f, wu, du)}
                            </button>
                          )
                        })}
                        {checks && (
                          <button
                            className={`check-col check${s.done ? ' on' : ''}`}
                            aria-label={s.done ? 'Mark set not done' : 'Mark set done'}
                            aria-pressed={s.done}
                            onClick={() => toggleDone(idx, s, ph)}
                          >
                            <IconCheck size={20} />
                          </button>
                        )}
                      </div>
                    </SwipeRow>
                    <RestBar
                      set={s}
                      live={mode === 'workout'}
                      selected={restPanelOpen && timer?.setId === s.id}
                      onTap={() => {
                        if (mode === 'workout' && timer?.setId === s.id) {
                          setFocus(null)
                          setRestPanelOpen?.(true)
                        } else void editRest(s)
                      }}
                    />
                  </div>
                )
              })}

              <button className="add-set" onClick={() => addSet(e)}>
                + Add Set{nextRest > 0 ? ` (${clock(nextRest)})` : ''}
              </button>
            </section>
          )
        })}

        <button className="big-btn blue-soft" onClick={() => setPicker({ mode: 'add' })}>
          Add Exercises
        </button>
        {footer}
        {/* extra room so the focused row / running rest bar can scroll above the bottom panel */}
        <div style={{ height: keypadOpen || restPanelOpen ? 220 : 120 }} />
      </div>

      {keypadOpen && (
        <Keypad
          allowDot={focusedField === 'weight' || focusedField === 'distance'}
          onKey={onKey}
          onBackspace={onBackspace}
          onStep={onStep}
          onNext={onNext}
          onHide={() => setFocus(null)}
          nextLabel={focusIndex >= cells.length - 1 ? 'Done' : 'Next'}
        />
      )}
      {restPanelOpen && <RestPanel onHide={() => setRestPanelOpen?.(false)} />}

      {picker && (
        <ExercisePicker
          multi={picker.mode === 'add'}
          title={picker.mode === 'add' ? 'Add Exercises' : 'Replace Exercise'}
          onDone={onPicked}
          onClose={() => setPicker(null)}
        />
      )}
      {detailId && <ExerciseDetail exerciseId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}

function RestBar({ set, live, selected, onTap }: { set: WSet; live: boolean; selected: boolean; onTap: () => void }) {
  const timer = useWorkout((s) => s.timer)
  const active = live && timer?.setId === set.id
  const now = useNow(200, active && timer?.endsAt != null)
  if (active && timer) {
    const rem = timerRemaining(timer, now)
    const pct = Math.max(0, Math.min(100, (rem / timer.duration) * 100))
    return (
      <button className={`rest-bar running${selected ? ' selected' : ''}`} onClick={onTap} aria-label="Rest timer controls">
        <span className="rest-fill" style={{ width: `${pct}%` }} />
        <span className="rest-time">{clock(Math.ceil(rem))}</span>
      </button>
    )
  }
  if (set.rest <= 0)
    return (
      <button className="rest-bar off" onClick={onTap} aria-label="Set rest timer">
        <span className="rest-line" />
      </button>
    )
  return (
    <button className={`rest-bar${set.done && live ? ' spent' : ''}`} onClick={onTap} aria-label={`Rest ${clock(set.rest)}, tap to change`}>
      <span className="rest-line" />
      <span className="rest-label">{clock(set.rest)}</span>
      <span className="rest-line" />
    </button>
  )
}
