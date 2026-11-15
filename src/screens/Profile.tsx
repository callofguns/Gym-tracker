import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useExercises, useWorkouts } from '../hooks/data'
import { useSettings } from '../stores/settings'
import { useUI } from '../stores/ui'
import { BarChart, LineChart } from '../components/Charts'
import { ExercisePicker } from '../components/ExercisePicker'
import { IconChevronRight, IconDots, IconPerson, IconPlus, IconRuler, IconTarget, IconCamera, IconClose } from '../components/Icons'
import { openMenu, promptDialog } from '../components/overlay'
import { exerciseSeries, weekBuckets } from '../lib/series'
import { workoutVolume } from '../lib/sets'
import { kgTo, num, weightShort } from '../lib/units'
import { uid } from '../lib/id'
import type { MeasurementKind, Widget, WidgetKind } from '../types'

const WIDGET_TITLES: Record<WidgetKind, string> = {
  workouts_per_week: 'Workouts Per Week',
  volume_per_week: 'Volume Per Week',
  exercise_1rm: 'Estimated 1RM',
  exercise_best: 'Best Set',
  exercise_volume: 'Exercise Volume',
  measurement: 'Measurement',
}

export function Profile() {
  const workouts = useWorkouts() ?? []
  const name = useSettings((s) => s.name)
  const avatar = useSettings((s) => s.avatar)
  const widgets = useSettings((s) => s.widgets)
  const set = useSettings((s) => s.set)
  const push = useUI((s) => s.push)
  const [editing, setEditing] = useState(false)
  const [pickFor, setPickFor] = useState<WidgetKind | null>(null)

  const addWidget = (el: Element) =>
    openMenu(el, [
      { label: 'Workouts Per Week', onClick: () => set({ widgets: [...widgets, { id: uid(), kind: 'workouts_per_week' }] }) },
      { label: 'Volume Per Week', onClick: () => set({ widgets: [...widgets, { id: uid(), kind: 'volume_per_week' }] }) },
      { label: 'Exercise: Estimated 1RM', onClick: () => setPickFor('exercise_1rm') },
      { label: 'Exercise: Best Set', onClick: () => setPickFor('exercise_best') },
      { label: 'Exercise: Volume', onClick: () => setPickFor('exercise_volume') },
      { label: 'Body Weight', onClick: () => set({ widgets: [...widgets, { id: uid(), kind: 'measurement', measurement: 'bodyweight' }] }) },
      { label: 'Body Fat %', onClick: () => set({ widgets: [...widgets, { id: uid(), kind: 'measurement', measurement: 'bodyfat' }] }) },
    ])

  return (
    <div className="tab-page">
      <div className="top-actions">
        <button className="icon-btn blue" aria-label="Measurements" onClick={() => push({ kind: 'measurements' })}>
          <IconRuler size={24} />
        </button>
      </div>
      <h1 className="page-title">Profile</h1>
      <button className="profile-row" onClick={() => setEditing(true)}>
        <span className="avatar">{avatar ? <img src={avatar} alt="" /> : <IconPerson size={40} />}</span>
        <span className="profile-text">
          <strong>{name}</strong>
          <span className="muted">
            {workouts.length} workout{workouts.length === 1 ? '' : 's'}
          </span>
        </span>
        <IconChevronRight size={20} className="blue" />
      </button>

      <div className="section-head">
        <h2 className="section-title">Dashboard</h2>
        <button className="pill-btn blue-soft" onClick={(e) => addWidget(e.currentTarget)}>
          <IconPlus size={18} /> Widget
        </button>
      </div>
      {widgets.length === 0 && <p className="empty left">No widgets. Tap “+ Widget” to add a chart.</p>}
      {widgets.map((w) => (
        <WidgetCard key={w.id} widget={w} onRemove={() => set({ widgets: widgets.filter((x) => x.id !== w.id) })} />
      ))}

      {pickFor && (
        <ExercisePicker
          multi={false}
          title="Choose Exercise"
          onClose={() => setPickFor(null)}
          onDone={([id]) => {
            set({ widgets: [...widgets, { id: uid(), kind: pickFor, exerciseId: id }] })
            setPickFor(null)
          }}
        />
      )}
      {editing && <EditProfile onClose={() => setEditing(false)} />}
    </div>
  )
}

function WidgetCard({ widget, onRemove }: { widget: Widget; onRemove: () => void }) {
  const workouts = useWorkouts() ?? []
  const lib = useExercises()
  const wu = useSettings((s) => s.weightUnit)
  const goal = useSettings((s) => s.weeklyGoal)
  const set = useSettings((s) => s.set)
  const measurements = useLiveQuery(
    () => (widget.kind === 'measurement' ? db.measurements.where('kind').equals(widget.measurement!).sortBy('date') : []),
    [widget.kind, widget.measurement],
  )

  const fmtW = (n: number) => num(kgTo(n, wu), 0)

  const body = useMemo(() => {
    switch (widget.kind) {
      case 'workouts_per_week':
        return <BarChart data={weekBuckets(workouts, 8, () => 1)} goal={goal} />
      case 'volume_per_week':
        return <BarChart data={weekBuckets(workouts, 8, (w) => kgTo(workoutVolume(w.exercises, lib.cat), wu))} format={(n) => num(n / 1000, 1) + 'k'} />
      case 'exercise_1rm':
      case 'exercise_best':
      case 'exercise_volume': {
        const metric = widget.kind === 'exercise_1rm' ? '1rm' : widget.kind === 'exercise_best' ? 'best' : 'volume'
        return <LineChart points={exerciseSeries(workouts, widget.exerciseId!, lib.cat(widget.exerciseId!), metric)} format={fmtW} />
      }
      case 'measurement':
        return (
          <LineChart
            points={(measurements ?? []).map((m) => ({ t: m.date, v: widget.measurement === 'bodyweight' ? kgTo(m.value, wu) : m.value }))}
            format={(n) => num(n, 1)}
          />
        )
    }
  }, [widget, workouts, lib, wu, goal, measurements])

  const subtitle =
    widget.kind === 'workouts_per_week'
      ? 'Activity'
      : widget.kind === 'volume_per_week'
        ? `Total ${weightShort(wu)} lifted`
        : widget.kind === 'measurement'
          ? widget.measurement === 'bodyweight'
            ? `Body Weight (${weightShort(wu)})`
            : 'Body Fat (%)'
          : lib.get(widget.exerciseId!).name

  const title = widget.kind === 'measurement' ? measurementTitle(widget.measurement!) : WIDGET_TITLES[widget.kind]

  return (
    <div className="card widget">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          <div className="muted small">{subtitle}</div>
        </div>
        <div className="head-btns">
          {widget.kind === 'workouts_per_week' && (
            <button
              className="chip-icon"
              aria-label="Set weekly goal"
              onClick={async () => {
                const v = await promptDialog({ title: 'Weekly Goal (workouts)', value: goal ? String(goal) : '', inputType: 'number', placeholder: 'e.g. 4' })
                if (v == null) return
                const n = Math.round(Number(v))
                set({ weeklyGoal: Number.isFinite(n) && n > 0 ? Math.min(14, n) : null })
              }}
            >
              <IconTarget size={20} />
            </button>
          )}
          <button
            className="chip-icon"
            aria-label="Widget options"
            onClick={(e) => openMenu(e.currentTarget, [{ label: 'Remove Widget', danger: true, onClick: onRemove }])}
          >
            <IconDots size={20} />
          </button>
        </div>
      </div>
      {body}
    </div>
  )
}

const measurementTitle = (k: MeasurementKind) => (k === 'bodyweight' ? 'Body Weight' : 'Body Fat')

function EditProfile({ onClose }: { onClose: () => void }) {
  const name = useSettings((s) => s.name)
  const avatar = useSettings((s) => s.avatar)
  const set = useSettings((s) => s.set)
  const [n, setN] = useState(name)
  const [img, setImg] = useState(avatar)

  const pick = (file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const size = 256
      const c = document.createElement('canvas')
      c.width = c.height = size
      const ctx = c.getContext('2d')!
      const s = Math.min(im.width, im.height)
      ctx.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, size, size)
      setImg(c.toDataURL('image/jpeg', 0.85))
      URL.revokeObjectURL(url)
    }
    im.src = url
  }

  return (
    <div className="page sheet-page form-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">Edit Profile</div>
        <button
          className="pill-btn blue"
          onClick={() => {
            set({ name: n.trim() || 'Your Name', avatar: img })
            onClose()
          }}
        >
          Save
        </button>
      </header>
      <div className="page-scroll form">
        <label className="avatar big">
          {img ? <img src={img} alt="" /> : <IconPerson size={64} />}
          <span className="avatar-cam">
            <IconCamera size={18} />
          </span>
          <input type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {img && (
          <button className="text-btn center-block" onClick={() => setImg(null)}>
            Remove Photo
          </button>
        )}
        <label className="field">
          <span>Name</span>
          <input className="text-input" value={n} onChange={(e) => setN(e.target.value)} />
        </label>
      </div>
    </div>
  )
}
