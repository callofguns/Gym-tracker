import { useState } from 'react'
import { db } from '../db'
import { usePreviousSets } from '../hooks/data'
import { SetEditor } from '../components/SetEditor'
import { IconClose } from '../components/Icons'
import { confirmDialog } from '../components/overlay'
import { uid } from '../lib/id'
import type { Template, WExercise } from '../types'

export function TemplateEditor({ template, onClose }: { template: Template | null; onClose: () => void }) {
  const [name, setName] = useState(template?.name ?? '')
  const [exercises, setExercises] = useState<WExercise[]>(template?.exercises ?? [])
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState('')
  const previous = usePreviousSets()

  const update = (fn: (e: WExercise[]) => WExercise[]) => {
    setDirty(true)
    setExercises(fn)
  }

  const close = async () => {
    if (dirty) {
      const ok = await confirmDialog({
        title: 'Discard Changes?',
        message: 'Your changes to this template will be lost.',
        buttons: [
          { label: 'Discard', variant: 'red', value: true },
          { label: 'Keep Editing', variant: 'plain', value: false },
        ],
      })
      if (!ok) return
    }
    onClose()
  }

  const save = async () => {
    const n = name.trim()
    if (!n) return setError('Give the template a name.')
    const now = Date.now()
    const clean = exercises.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s, done: false })) }))
    await db.templates.put({
      id: template?.id ?? uid(),
      name: n,
      exercises: clean,
      createdAt: template?.createdAt ?? now,
      updatedAt: now,
      lastUsedAt: template?.lastUsedAt ?? null,
    })
    onClose()
  }

  return (
    <div className="page sheet-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={close} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">{template ? 'Edit Template' : 'New Template'}</div>
        <button className="pill-btn blue" onClick={save}>
          Save
        </button>
      </header>
      <SetEditor
        mode="template"
        exercises={exercises}
        update={update}
        previous={previous}
        header={
          <div className="workout-head">
            <input
              className="title-input"
              placeholder="Template Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setDirty(true)
                setError('')
              }}
              aria-label="Template name"
            />
            {error && <p className="error">{error}</p>}
          </div>
        }
      />
    </div>
  )
}
