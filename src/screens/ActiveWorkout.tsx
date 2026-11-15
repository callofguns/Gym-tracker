import { useMemo, useRef, useState } from 'react'
import { useWorkout, timerRemaining } from '../stores/workout'
import { useUI } from '../stores/ui'
import { useSettings } from '../stores/settings'
import { useExercises, usePreviousSets, useWorkouts } from '../hooks/data'
import { useNow } from '../hooks/useNow'
import { SetEditor } from '../components/SetEditor'
import { IconCalendar, IconClock, IconDots, IconTimer } from '../components/Icons'
import { confirmDialog, openMenu, pickRest, promptDialog } from '../components/overlay'
import { clock, fmtDate, toLocalInput } from '../lib/format'
import { cleanExercises, fillFrom, hasValues, placeholdersFor } from '../lib/sets'
import { findPRs, recordsByExercise } from '../lib/records'
import { db } from '../db'
import type { WExercise, WSet, Workout } from '../types'

export function ActiveWorkout() {
  const active = useWorkout((s) => s.active)
  const minimized = useWorkout((s) => s.minimized)
  if (!active) return null
  return minimized ? <MiniBar /> : <WorkoutSheet />
}

function MiniBar() {
  const active = useWorkout((s) => s.active)!
  const timer = useWorkout((s) => s.timer)
  const now = useNow(1000)
  return (
    <button className="mini-bar" onClick={() => useWorkout.getState().setMinimized(false)} aria-label="Open workout">
      <span className="mini-handle" />
      <span className="mini-name">{active.name}</span>
      <span className="mini-time">
        {timer ? <span className="blue">Rest {clock(Math.ceil(timerRemaining(timer, now)))}</span> : clock((now - active.startedAt) / 1000)}
      </span>
    </button>
  )
}

/** Fill unfinished sets with their placeholder values (same lookup the editor shows). */
function fillWithPlaceholders(e: WExercise, prev: WSet[], cat: ReturnType<typeof useExercises>['cat']): WSet[] {
  const c = cat(e.exerciseId)
  const phs = placeholdersFor(e.sets, prev, c)
  return e.sets.map((s, i) => (s.done ? s : fillFrom(s, phs[i], c)))
}

function WorkoutSheet() {
  const active = useWorkout((s) => s.active)!
  const timer = useWorkout((s) => s.timer)
  const { update, patch, end, setMinimized, startTimer } = useWorkout.getState()
  const defaultRest = useSettings((s) => s.defaultRest)
  const lib = useExercises()
  const workouts = useWorkouts()
  const previous = usePreviousSets()
  const now = useNow(1000)
  const [scrolled, setScrolled] = useState(false)
  const [restOpen, setRestOpen] = useState(false)
  const [drag, setDrag] = useState(0)
  const dragStart = useRef<number | null>(null)

  const prior = useMemo(() => recordsByExercise(workouts ?? [], lib.cat), [workouts, lib.cat])
  const prSetIds = useMemo(() => findPRs(active.exercises, prior, lib.cat).setIds, [active.exercises, prior, lib.cat])
  const elapsed = clock((now - active.startedAt) / 1000)

  // ----- drag the handle down to minimize -----
  const onDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (dragStart.current != null) setDrag(Math.max(0, e.clientY - dragStart.current))
  }
  const onUp = () => {
    if (dragStart.current == null) return
    const d = drag
    dragStart.current = null
    setDrag(0)
    if (d > 110 || d < 4) setMinimized(true)
  }

  const timerButton = async () => {
    if (timer) return setRestOpen(true)
    const v = await pickRest('Start Rest Timer', defaultRest)
    if (v) {
      startTimer(v, null)
      setRestOpen(true)
    }
  }

  const cancel = async () => {
    const ok = await confirmDialog({
      title: 'Cancel Workout?',
      message: 'Are you sure you want to cancel this workout? All progress will be lost.',
      buttons: [
        { label: 'Cancel Workout', variant: 'red', value: true },
        { label: 'Resume', variant: 'plain', value: false },
      ],
    })
    if (ok) end()
  }

  const finish = async () => {
    let exs = active.exercises.map((e) => {
      const filled = fillWithPlaceholders(e, previous.get(e.exerciseId) ?? [], lib.cat)
      return { e, filled }
    })
    const unfinished = exs.some(({ e, filled }) => filled.some((s) => !s.done && hasValues(s, lib.cat(e.exerciseId))))
    if (unfinished) {
      const choice = await confirmDialog({
        emoji: '🎉',
        title: 'Finish Workout?',
        message:
          'There are valid sets in this workout that have not been marked as complete. Invalid or empty sets will be removed.',
        buttons: [
          { label: 'Complete Unfinished Sets', variant: 'green', value: 'complete' as const },
          { label: 'Discard Unfinished Sets', variant: 'red', value: 'discard' as const },
          { label: 'Cancel', variant: 'plain', value: null },
        ],
      })
      if (!choice) return
      if (choice === 'complete')
        exs = exs.map(({ e, filled }) => ({ e, filled: filled.map((s) => (hasValues(s, lib.cat(e.exerciseId)) ? { ...s, done: true } : s)) }))
    }
    const final = cleanExercises(
      exs.map(({ e, filled }) => ({ ...e, sets: filled })),
      lib.cat,
      true,
    )
    if (!final.length) {
      const c = await confirmDialog({
        title: 'No Completed Sets',
        message: 'Tick off at least one set to save this workout, or cancel it.',
        buttons: [
          { label: 'Keep Going', variant: 'blue', value: false },
          { label: 'Cancel Workout', variant: 'red', value: true },
        ],
      })
      if (c) end()
      return
    }
    const prs = findPRs(final, prior, lib.cat)
    const w: Workout = {
      id: active.id,
      name: active.name,
      startedAt: active.startedAt,
      endedAt: Date.now(),
      templateId: active.templateId,
      exercises: final,
      prCount: prs.count,
    }
    await db.workouts.put(w)
    if (active.templateId) await db.templates.update(active.templateId, { lastUsedAt: w.endedAt })
    end()
    useUI.getState().push({ kind: 'summary', workoutId: w.id, templateId: active.templateId })
  }

  const workoutMenu = (el: Element) =>
    openMenu(el, [
      {
        label: 'Rename Workout',
        onClick: async () => {
          const n = await promptDialog({ title: 'Workout Name', value: active.name })
          if (n?.trim()) patch({ name: n.trim() })
        },
      },
      {
        label: 'Adjust Start Time',
        onClick: async () => {
          const v = await promptDialog({ title: 'Start Time', value: toLocalInput(active.startedAt), inputType: 'datetime-local' })
          const t = v ? new Date(v).getTime() : NaN
          if (Number.isFinite(t) && t <= Date.now()) patch({ startedAt: t })
        },
      },
    ])

  return (
    <div className="sheet-backdrop">
      <div className="workout-sheet" style={{ transform: drag ? `translateY(${drag}px)` : undefined }}>
        <div className="sheet-top" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <span className="handle" />
        </div>
        <div className={`sheet-bar${scrolled ? ' scrolled' : ''}`}>
          <button className={`timer-btn${timer ? ' running' : ''}`} onClick={timerButton} aria-label="Rest timer">
            {timer ? <TimerText /> : <IconTimer size={22} />}
          </button>
          <span className="bar-elapsed">{scrolled ? elapsed : ''}</span>
          <button className="finish-btn" onClick={finish}>
            Finish
          </button>
        </div>
        <SetEditor
          mode="workout"
          exercises={active.exercises}
          update={update}
          previous={previous}
          prSetIds={prSetIds}
          restPanelOpen={restOpen}
          setRestPanelOpen={setRestOpen}
          onScroll={(top) => setScrolled(top > 120)}
          header={
            <div className="workout-head">
              <div className="title-row">
                <h1 className="workout-title" onClick={(e) => workoutMenu(e.currentTarget)}>
                  {active.name}
                </h1>
                <button className="chip-icon" aria-label="Workout options" onClick={(e) => workoutMenu(e.currentTarget)}>
                  <IconDots size={20} />
                </button>
              </div>
              <div className="meta-line">
                <IconCalendar size={22} /> {fmtDate(active.startedAt)}
              </div>
              <div className="meta-line">
                <IconClock size={22} /> {elapsed}
              </div>
            </div>
          }
          footer={
            <button className="big-btn red-soft" onClick={cancel}>
              Cancel Workout
            </button>
          }
        />
      </div>
    </div>
  )
}

function TimerText() {
  const timer = useWorkout((s) => s.timer)
  const now = useNow(250)
  if (!timer) return null
  return <span>{clock(Math.ceil(timerRemaining(timer, now)))}</span>
}
