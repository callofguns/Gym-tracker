import { db } from '../db'
import { useUI } from '../stores/ui'
import { confirmDialog, openMenu, promptDialog } from '../components/overlay'
import { cloneExercises } from './start'
import { uid } from './id'
import type { Workout } from '../types'

export function workoutMenu(el: Element, w: Workout, after?: () => void) {
  const { push, showToast } = useUI.getState()
  openMenu(el, [
    { label: 'Edit Workout', onClick: () => push({ kind: 'workoutEdit', workout: w }) },
    {
      label: 'Save as Template',
      onClick: async () => {
        const name = await promptDialog({ title: 'Template Name', value: w.name })
        if (!name?.trim()) return
        const now = Date.now()
        await db.templates.add({
          id: uid(),
          name: name.trim(),
          exercises: cloneExercises(w.exercises),
          createdAt: now,
          updatedAt: now,
          lastUsedAt: null,
        })
        showToast(`Saved “${name.trim()}” to My Templates`)
      },
    },
    {
      label: 'Delete',
      danger: true,
      onClick: async () => {
        const ok = await confirmDialog({
          title: 'Delete Workout?',
          message: `“${w.name}” will be permanently deleted.`,
          buttons: [
            { label: 'Delete', variant: 'red', value: true },
            { label: 'Cancel', variant: 'plain', value: false },
          ],
        })
        if (ok) {
          await db.workouts.delete(w.id)
          after?.()
        }
      },
    },
  ])
}
