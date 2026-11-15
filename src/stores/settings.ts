import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Widget } from '../types'
import type { DistanceUnit, WeightUnit } from '../lib/units'
import { uid } from '../lib/id'

export type Theme = 'system' | 'dark' | 'light'

interface SettingsState {
  weightUnit: WeightUnit
  distanceUnit: DistanceUnit
  /** seconds */
  defaultRest: number
  theme: Theme
  name: string
  /** small JPEG data URL */
  avatar: string | null
  weeklyGoal: number | null
  widgets: Widget[]
  set: (patch: Partial<Omit<SettingsState, 'set' | 'reset'>>) => void
  reset: () => void
}

const defaults = {
  weightUnit: 'kg' as WeightUnit,
  distanceUnit: 'km' as DistanceUnit,
  defaultRest: 90,
  theme: 'system' as Theme,
  name: 'Your Name',
  avatar: null,
  weeklyGoal: null,
  widgets: [{ id: uid(), kind: 'workouts_per_week' }] as Widget[],
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set({ ...defaults, widgets: [{ id: uid(), kind: 'workouts_per_week' }] }),
    }),
    { name: 'liftlog-settings', version: 1 },
  ),
)
