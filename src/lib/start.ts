import type { Template, WExercise } from '../types'
import { useWorkout } from '../stores/workout'
import { useUI } from '../stores/ui'
import { confirmDialog } from '../components/overlay'
import { uid } from './id'
import { newSet } from './sets'
import { timeOfDayName } from './format'

export function cloneExercises(exs: WExercise[], keepDone = false): WExercise[] {
  const ss = new Map<string, string>()
  return exs.map((e) => {
    let supersetId: string | null = null
    if (e.supersetId) {
      if (!ss.has(e.supersetId)) ss.set(e.supersetId, uid())
      supersetId = ss.get(e.supersetId)!
    }
    return {
      id: uid(),
      exerciseId: e.exerciseId,
      supersetId,
      sets: e.sets.map((s) => ({ ...newSet(s.rest, s), done: keepDone ? s.done : false })),
    }
  })
}

/** Start a workout (empty or from a template). Asks first if one is already running. */
export async function startWorkout(template: Template | null, isExample = false) {
  const { active, start, setMinimized } = useWorkout.getState()
  if (active) {
    const choice = await confirmDialog({
      title: 'Workout in Progress',
      message: `You already have “${active.name}” going. Do you want to resume it or discard it and start a new one?`,
      buttons: [
        { label: 'Resume Workout', variant: 'blue', value: 'resume' as const },
        { label: 'Discard and Start New', variant: 'red', value: 'new' as const },
        { label: 'Cancel', variant: 'plain', value: null },
      ],
    })
    if (choice === 'resume') return setMinimized(false)
    if (choice !== 'new') return
  }
  start({
    id: uid(),
    name: template?.name ?? timeOfDayName(),
    startedAt: Date.now(),
    templateId: template && !isExample ? template.id : null,
    exercises: template ? cloneExercises(template.exercises) : [],
  })
  useUI.getState().setTab('start')
}
