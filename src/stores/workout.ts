import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActiveWorkout, WExercise } from '../types'

export interface RestTimer {
  /** set the timer belongs to (null = started from the header button) */
  setId: string | null
  /** full length, seconds */
  duration: number
  /** epoch ms when it ends, when running */
  endsAt: number | null
  /** seconds left, when paused */
  remaining: number
}

interface WorkoutState {
  active: ActiveWorkout | null
  minimized: boolean
  timer: RestTimer | null
  start: (w: ActiveWorkout) => void
  update: (fn: (exs: WExercise[]) => WExercise[]) => void
  patch: (p: Partial<ActiveWorkout>) => void
  end: () => void
  setMinimized: (m: boolean) => void
  startTimer: (seconds: number, setId: string | null) => void
  pauseTimer: () => void
  resumeTimer: () => void
  adjustTimer: (delta: number) => void
  resetTimer: () => void
  clearTimer: () => void
}

export function timerRemaining(t: RestTimer, now = Date.now()): number {
  return t.endsAt != null ? Math.max(0, (t.endsAt - now) / 1000) : t.remaining
}

export const useWorkout = create<WorkoutState>()(
  persist(
    (set, get) => ({
      active: null,
      minimized: false,
      timer: null,
      start: (w) => set({ active: w, minimized: false, timer: null }),
      update: (fn) => {
        const a = get().active
        if (a) set({ active: { ...a, exercises: fn(a.exercises) } })
      },
      patch: (p) => {
        const a = get().active
        if (a) set({ active: { ...a, ...p } })
      },
      end: () => set({ active: null, minimized: false, timer: null }),
      setMinimized: (minimized) => set({ minimized }),
      startTimer: (seconds, setId) =>
        set({ timer: { setId, duration: seconds, endsAt: Date.now() + seconds * 1000, remaining: seconds } }),
      pauseTimer: () => {
        const t = get().timer
        if (t && t.endsAt != null) set({ timer: { ...t, remaining: timerRemaining(t), endsAt: null } })
      },
      resumeTimer: () => {
        const t = get().timer
        if (t && t.endsAt == null) set({ timer: { ...t, endsAt: Date.now() + t.remaining * 1000 } })
      },
      adjustTimer: (delta) => {
        const t = get().timer
        if (!t) return
        const rem = Math.max(0, timerRemaining(t) + delta)
        const duration = Math.max(1, t.duration + delta)
        if (rem <= 0) return set({ timer: null })
        set({
          timer: { ...t, duration, remaining: rem, endsAt: t.endsAt != null ? Date.now() + rem * 1000 : null },
        })
      },
      resetTimer: () => {
        const t = get().timer
        if (t) set({ timer: { ...t, remaining: t.duration, endsAt: t.endsAt != null ? Date.now() + t.duration * 1000 : null } })
      },
      clearTimer: () => set({ timer: null }),
    }),
    { name: 'liftlog-active-workout', version: 1 },
  ),
)
