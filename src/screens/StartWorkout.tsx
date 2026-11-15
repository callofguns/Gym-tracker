import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { EXAMPLE_TEMPLATES } from '../data/exampleTemplates'
import { useExercises } from '../hooks/data'
import { useUI } from '../stores/ui'
import { startWorkout, cloneExercises } from '../lib/start'
import { relativeDays } from '../lib/format'
import { uid } from '../lib/id'
import { IconClockSolid, IconDots, IconPlus } from '../components/Icons'
import { confirmDialog, openMenu } from '../components/overlay'
import type { Template } from '../types'

export function StartWorkout() {
  const templates = useLiveQuery(() => db.templates.orderBy('updatedAt').reverse().toArray(), [])
  const push = useUI((s) => s.push)

  const templateMenu = (el: Element, t: Template) =>
    openMenu(el, [
      { label: 'Edit Template', onClick: () => push({ kind: 'templateEditor', template: t }) },
      {
        label: 'Duplicate',
        onClick: async () => {
          const now = Date.now()
          await db.templates.add({ ...t, id: uid(), name: `${t.name} (Copy)`, exercises: cloneExercises(t.exercises), createdAt: now, updatedAt: now, lastUsedAt: null })
        },
      },
      {
        label: 'Delete',
        danger: true,
        onClick: async () => {
          const ok = await confirmDialog({
            title: 'Delete Template?',
            message: `“${t.name}” will be deleted. Past workouts are not affected.`,
            buttons: [
              { label: 'Delete', variant: 'red', value: true },
              { label: 'Cancel', variant: 'plain', value: false },
            ],
          })
          if (ok) await db.templates.delete(t.id)
        },
      },
    ])

  return (
    <div className="tab-page">
      <h1 className="page-title">Start Workout</h1>
      <h2 className="section-title">Quick Start</h2>
      <button className="big-btn blue" onClick={() => startWorkout(null)}>
        Start an Empty Workout
      </button>

      <div className="section-head">
        <h2 className="h-lg">Templates</h2>
        <button className="pill-btn blue-soft" onClick={() => push({ kind: 'templateEditor', template: null })}>
          <IconPlus size={18} /> Template
        </button>
      </div>

      <div className="section-head">
        <h3 className="section-title">My Templates ({templates?.length ?? 0})</h3>
      </div>
      {templates && templates.length === 0 && (
        <p className="empty left">No templates yet. Tap “+ Template” to make one, or copy an example below.</p>
      )}
      <div className="template-grid">
        {templates?.map((t) => (
          <TemplateCard key={t.id} t={t} onOpen={() => push({ kind: 'templatePreview', template: t, example: false })} onMenu={(el) => templateMenu(el, t)} />
        ))}
      </div>

      <div className="section-head">
        <h3 className="section-title">Example Templates ({EXAMPLE_TEMPLATES.length})</h3>
      </div>
      <div className="template-grid">
        {EXAMPLE_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} t={t} onOpen={() => push({ kind: 'templatePreview', template: t, example: true })} />
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ t, onOpen, onMenu }: { t: Template; onOpen: () => void; onMenu?: (el: Element) => void }) {
  const lib = useExercises()
  const names = t.exercises.map((e) => lib.get(e.exerciseId).name)
  const text = names.length > 4 ? `${names.slice(0, 4).join(', ')} & ${names.length - 4} more...` : names.join(', ')
  return (
    <div className="card template-card">
      <div className="card-head">
        <button className="card-title trunc" onClick={onOpen}>
          {t.name}
        </button>
        {onMenu && (
          <button className="chip-icon" aria-label="Template options" onClick={(e) => onMenu(e.currentTarget)}>
            <IconDots size={20} />
          </button>
        )}
      </div>
      <button className="card-body" onClick={onOpen}>
        <p className="template-ex">{text || 'No exercises'}</p>
        {onMenu && (
          <p className="template-when">
            <IconClockSolid size={18} /> {t.lastUsedAt ? relativeDays(t.lastUsedAt) : 'Never'}
          </p>
        )}
      </button>
    </div>
  )
}
