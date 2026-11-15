import type { Template, WExercise } from '../types'
import { slug } from '../lib/id'

type Spec = [exerciseName: string, sets: number, reps: number | null, duration?: number]

function build(id: string, name: string, specs: Spec[]): Template {
  const exercises: WExercise[] = specs.map(([exName, sets, reps, duration], i) => ({
    id: `${id}-${i}`,
    exerciseId: slug(exName),
    supersetId: null,
    sets: Array.from({ length: sets }, (_, j) => ({
      id: `${id}-${i}-${j}`,
      type: 'normal' as const,
      weight: null,
      reps,
      distance: null,
      duration: duration ?? null,
      rest: 90,
      done: false,
    })),
  }))
  return { id, name, exercises, createdAt: 0, updatedAt: 0, lastUsedAt: null }
}

export const EXAMPLE_TEMPLATES: Template[] = [
  build('example-push', 'Push', [
    ['Bench Press (Barbell)', 3, 8],
    ['Incline Bench Press (Dumbbell)', 3, 10],
    ['Shoulder Press (Dumbbell)', 3, 10],
    ['Lateral Raise (Dumbbell)', 3, 12],
    ['Triceps Pushdown (Cable)', 3, 12],
  ]),
  build('example-pull', 'Pull', [
    ['Deadlift (Barbell)', 3, 5],
    ['Pull Up', 3, 8],
    ['Bent Over Row (Barbell)', 3, 8],
    ['Face Pull (Cable)', 3, 15],
    ['Bicep Curl (Dumbbell)', 3, 12],
  ]),
  build('example-legs', 'Legs', [
    ['Squat (Barbell)', 3, 8],
    ['Romanian Deadlift (Barbell)', 3, 10],
    ['Leg Press (Machine)', 3, 12],
    ['Lying Leg Curl (Machine)', 3, 12],
    ['Standing Calf Raise (Machine)', 3, 15],
  ]),
  build('example-full-body', 'Full Body', [
    ['Squat (Barbell)', 3, 8],
    ['Bench Press (Barbell)', 3, 8],
    ['Bent Over Row (Barbell)', 3, 8],
    ['Overhead Press (Barbell)', 3, 10],
    ['Plank', 3, null, 60],
  ]),
  build('example-upper', 'Upper Body', [
    ['Bench Press (Barbell)', 3, 8],
    ['Bent Over Row (Barbell)', 3, 8],
    ['Overhead Press (Barbell)', 3, 10],
    ['Lat Pulldown (Cable)', 3, 10],
    ['Bicep Curl (Dumbbell)', 3, 12],
    ['Triceps Pushdown (Cable)', 3, 12],
  ]),
  build('example-lower', 'Lower Body', [
    ['Squat (Barbell)', 3, 8],
    ['Romanian Deadlift (Barbell)', 3, 10],
    ['Leg Extension (Machine)', 3, 12],
    ['Seated Leg Curl (Machine)', 3, 12],
    ['Standing Calf Raise (Machine)', 3, 15],
    ['Hanging Leg Raise', 3, 12],
  ]),
]
