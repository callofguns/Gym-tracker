import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useExercises } from '../hooks/data'
import { useUI } from '../stores/ui'
import { startWorkout, cloneExercises } from '../lib/start'
import { uid } from '../lib/id'
import { MuscleIcon } from '../components/MuscleIcon'
import { IconClose } from '../components/Icons'
import { bodyPartLabel } from '../data/exercises'
import { relativeDays } from '../lib/format'
import type { Template } from '../types'

export function TemplatePreview({ template, example, onClose }: { template: Template; example: boolean; onClose: () => void }) {
  const lib = useExercises()
  // Keep in sync if the template is edited.
  const live = useLiveQuery(() => (example ? undefined : db.templates.get(template.id)), [template.id, example])
  const t = live ?? template
  const { replaceTop, showToast } = useUI.getState()

  const copy = async () => {
    const now = Date.now()
    await db.templates.add({ id: uid(), name: t.name, exercises: cloneExercises(t.exercises), createdAt: now, updatedAt: now, lastUsedAt: null })
    showToast(`“${t.name}” added to My Templates`)
    onClose()
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog preview" onClick={(e) => e.stopPropagation()}>
        <div className="preview-head">
          <button className="icon-btn soft" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
          <h2 className="dialog-title">{t.name}</h2>
          {!example ? (
            <button className="text-btn" onClick={() => replaceTop({ kind: 'templateEditor', template: t })}>
              Edit
            </button>
          ) : (
            <span className="icon-btn" />
          )}
        </div>
        {!example && <p className="muted center small">Last performed: {t.lastUsedAt ? relativeDays(t.lastUsedAt) : 'Never'}</p>}
        <div className="preview-list">
          {t.exercises.map((e) => {
            const ex = lib.get(e.exerciseId)
            return (
              <div key={e.id} className="preview-row">
                <MuscleIcon muscle={ex.muscle} size={40} />
                <div className="ex-text">
                  <span className="ex-name">
                    {e.sets.length} × {ex.name}
                  </span>
                  <span className="ex-sub">{bodyPartLabel(ex.bodyPart)}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="dialog-buttons">
          <button
            className="dlg-btn dlg-blue"
            onClick={() => {
              onClose()
              void startWorkout(t, example)
            }}
          >
            Start Workout
          </button>
          {example && (
            <button className="dlg-btn dlg-plain" onClick={copy}>
              Copy to My Templates
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
