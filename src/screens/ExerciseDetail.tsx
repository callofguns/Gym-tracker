import { useMemo, useState } from 'react'
import { useExercises, useWorkouts } from '../hooks/data'
import { useSettings } from '../stores/settings'
import { MuscleIcon } from '../components/MuscleIcon'
import { IconClose, IconDots } from '../components/Icons'
import { LineChart } from '../components/Charts'
import { confirmDialog, openMenu } from '../components/overlay'
import { ExerciseForm } from '../components/ExerciseForm'
import { bodyPartLabel, categoryLabel } from '../data/exercises'
import { fmtLongDate, clock } from '../lib/format'
import { fmtSet, isWeighted, setLabels } from '../lib/sets'
import { recordsByExercise } from '../lib/records'
import { exerciseSeries, type ExerciseMetric } from '../lib/series'
import { fmtWeight, kgTo, kmTo, num } from '../lib/units'
import { db } from '../db'

type Tab = 'history' | 'charts' | 'records'

export function ExerciseDetail({ exerciseId, onClose }: { exerciseId: string; onClose: () => void }) {
  const lib = useExercises()
  const workouts = useWorkouts() ?? []
  const wu = useSettings((s) => s.weightUnit)
  const du = useSettings((s) => s.distanceUnit)
  const [tab, setTab] = useState<Tab>('history')
  const [editing, setEditing] = useState(false)
  const ex = lib.get(exerciseId)
  const c = ex.category

  const history = useMemo(
    () =>
      workouts
        .map((w) => ({ w, sets: w.exercises.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets) }))
        .filter((x) => x.sets.length),
    [workouts, exerciseId],
  )
  const rec = useMemo(() => recordsByExercise(workouts, lib.cat).get(exerciseId), [workouts, lib.cat, exerciseId])

  const metrics: { id: ExerciseMetric; label: string; fmt: (n: number) => string }[] = isWeighted(c)
    ? c === 'assisted_bodyweight'
      ? [{ id: 'reps', label: 'Most Reps', fmt: (n) => String(Math.round(n)) }]
      : [
          { id: '1rm', label: 'Estimated 1RM', fmt: (n) => num(kgTo(n, wu), 0) },
          { id: 'best', label: 'Heaviest Weight', fmt: (n) => num(kgTo(n, wu), 0) },
          { id: 'volume', label: 'Total Volume', fmt: (n) => num(kgTo(n, wu), 0) },
        ]
    : c === 'reps_only'
      ? [{ id: 'reps', label: 'Most Reps', fmt: (n) => String(Math.round(n)) }]
      : c === 'cardio'
        ? [
            { id: 'distance', label: 'Distance', fmt: (n) => num(kmTo(n, du), 1) },
            { id: 'duration', label: 'Duration', fmt: (n) => clock(n) },
          ]
        : [{ id: 'duration', label: 'Longest Time', fmt: (n) => clock(n) }]

  const menu = (el: Element) =>
    openMenu(el, [
      { label: 'Edit Exercise', onClick: () => setEditing(true) },
      {
        label: 'Delete Exercise',
        danger: true,
        onClick: async () => {
          const ok = await confirmDialog({
            title: 'Delete Exercise?',
            message: 'It will be removed from the exercise list. Past workouts keep their sets.',
            buttons: [
              { label: 'Delete', variant: 'red', value: true },
              { label: 'Cancel', variant: 'plain', value: false },
            ],
          })
          if (ok) {
            await db.customExercises.put({ ...ex, archived: true })
            onClose()
          }
        },
      },
    ])

  const records: { label: string; value: string }[] = []
  if (rec) {
    if (isWeighted(c) && c !== 'assisted_bodyweight') {
      records.push({ label: 'Estimated 1RM', value: fmtWeight(rec.maxE1rm, wu) })
      records.push({ label: 'Heaviest Weight', value: fmtWeight(rec.maxWeight, wu) })
      records.push({ label: 'Best Set Volume', value: fmtWeight(rec.maxVolume, wu) })
    }
    if (rec.maxReps) records.push({ label: 'Most Reps', value: String(rec.maxReps) })
    if (rec.maxDistance) records.push({ label: 'Longest Distance', value: `${num(kmTo(rec.maxDistance, du))} ${du}` })
    if (rec.maxDuration) records.push({ label: 'Longest Time', value: clock(rec.maxDuration) })
  }

  return (
    <div className="page sheet-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">{ex.name}</div>
        {ex.custom ? (
          <button className="icon-btn" onClick={(e) => menu(e.currentTarget)} aria-label="Exercise options">
            <IconDots size={22} />
          </button>
        ) : (
          <span className="icon-btn" />
        )}
      </header>
      <div className="segmented page-seg">
        {(['history', 'charts', 'records'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="page-scroll">
        <div className="ex-hero">
          <MuscleIcon muscle={ex.muscle} size={96} />
          <div>
            <div className="ex-hero-name">{ex.name}</div>
            <div className="muted">
              {bodyPartLabel(ex.bodyPart)} · {categoryLabel(ex.category)}
            </div>
          </div>
        </div>

        {tab === 'history' &&
          (history.length ? (
            history.map(({ w, sets }) => {
              const labels = setLabels(sets)
              return (
                <div key={w.id} className="card">
                  <div className="card-title">{w.name}</div>
                  <div className="muted">{fmtLongDate(w.startedAt)}</div>
                  <div className="set-list">
                    {sets.map((s, i) => (
                      <div key={s.id} className="set-line">
                        <span className={`set-tag${s.type !== 'normal' ? ' t-' + s.type : ''}`}>{labels[i]}</span>
                        <span>{fmtSet(s, c, wu, du)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <p className="empty">No history yet. Do this exercise in a workout and it will show up here.</p>
          ))}

        {tab === 'charts' &&
          metrics.map((m) => (
            <div key={m.id} className="card">
              <div className="card-title">{m.label}</div>
              <LineChart points={exerciseSeries(workouts, exerciseId, c, m.id)} format={m.fmt} />
            </div>
          ))}

        {tab === 'records' &&
          (records.length ? (
            <div className="card">
              <div className="card-title">Personal Records</div>
              {records.map((r) => (
                <div key={r.label} className="kv">
                  <span>{r.label}</span>
                  <strong>{r.value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No records yet.</p>
          ))}
      </div>
      {editing && <ExerciseForm existing={ex} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />}
    </div>
  )
}
