import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Measurement, Template, Workout } from './types'

/**
 * Local-first storage (IndexedDB). Every record has a string id and plain JSON
 * fields, so a cloud sync layer can be added later without changing shapes.
 */
export class LiftlogDB extends Dexie {
  workouts!: EntityTable<Workout, 'id'>
  templates!: EntityTable<Template, 'id'>
  customExercises!: EntityTable<Exercise, 'id'>
  measurements!: EntityTable<Measurement, 'id'>

  constructor() {
    super('liftlog')
    this.version(1).stores({
      workouts: 'id, startedAt, templateId',
      templates: 'id, updatedAt',
      customExercises: 'id, name',
      measurements: 'id, kind, date',
    })
  }
}

export const db = new LiftlogDB()

export async function resetAllData() {
  await db.transaction('rw', [db.workouts, db.templates, db.customExercises, db.measurements], async () => {
    await Promise.all([db.workouts.clear(), db.templates.clear(), db.customExercises.clear(), db.measurements.clear()])
  })
}
