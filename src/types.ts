export type Category =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'kettlebell'
  | 'weighted_bodyweight'
  | 'assisted_bodyweight'
  | 'reps_only'
  | 'cardio'
  | 'duration'

export type BodyPart =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'full_body'
  | 'cardio'
  | 'other'

export type Muscle =
  | 'chest'
  | 'upper_back'
  | 'lats'
  | 'lower_back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body'
  | 'cardio'

export interface Exercise {
  id: string
  name: string
  bodyPart: BodyPart
  category: Category
  muscle: Muscle
  custom?: boolean
  /** Custom exercises are archived instead of deleted so history keeps its names. */
  archived?: boolean
  createdAt?: number
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure'

/** One set. Weight is always stored in kg, distance in km, duration in seconds. */
export interface WSet {
  id: string
  type: SetType
  weight: number | null
  reps: number | null
  distance: number | null
  duration: number | null
  /** Rest after this set, in seconds. 0 = no rest timer. */
  rest: number
  done: boolean
}

export interface WExercise {
  id: string
  exerciseId: string
  /** Exercises sharing a supersetId are linked. */
  supersetId: string | null
  sets: WSet[]
}

export interface Workout {
  id: string
  name: string
  startedAt: number
  endedAt: number
  templateId: string | null
  exercises: WExercise[]
  prCount: number
}

export interface Template {
  id: string
  name: string
  exercises: WExercise[]
  createdAt: number
  updatedAt: number
  lastUsedAt: number | null
}

export interface ActiveWorkout {
  id: string
  name: string
  startedAt: number
  templateId: string | null
  exercises: WExercise[]
}

export type MeasurementKind = 'bodyweight' | 'bodyfat'

export interface Measurement {
  id: string
  kind: MeasurementKind
  /** bodyweight in kg, bodyfat in % */
  value: number
  date: number
}

export type WidgetKind =
  | 'workouts_per_week'
  | 'volume_per_week'
  | 'exercise_1rm'
  | 'exercise_best'
  | 'exercise_volume'
  | 'measurement'

export interface Widget {
  id: string
  kind: WidgetKind
  exerciseId?: string
  measurement?: MeasurementKind
}

export type Field = 'weight' | 'reps' | 'distance' | 'duration'
