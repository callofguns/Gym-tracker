import { create } from 'zustand'
import type { Template, Workout } from '../types'

export type Tab = 'profile' | 'history' | 'start' | 'exercises' | 'settings'

/** Full-screen pages / sheets pushed over the tabs. */
export type Page =
  | { kind: 'templateEditor'; template: Template | null }
  | { kind: 'templatePreview'; template: Template; example: boolean }
  | { kind: 'workoutDetail'; workoutId: string }
  | { kind: 'workoutEdit'; workout: Workout }
  | { kind: 'exerciseDetail'; exerciseId: string }
  | { kind: 'measurements' }
  | { kind: 'calendar' }
  | { kind: 'summary'; workoutId: string; templateId: string | null }

interface UIState {
  tab: Tab
  pages: Page[]
  toast: string | null
  setTab: (t: Tab) => void
  push: (p: Page) => void
  pop: () => void
  replaceTop: (p: Page) => void
  showToast: (msg: string) => void
  scrollToWorkout: string | null
  setScrollToWorkout: (id: string | null) => void
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const useUI = create<UIState>()((set, get) => ({
  tab: 'start',
  pages: [],
  toast: null,
  scrollToWorkout: null,
  setTab: (tab) => set({ tab }),
  push: (p) => set({ pages: [...get().pages, p] }),
  pop: () => set({ pages: get().pages.slice(0, -1) }),
  replaceTop: (p) => set({ pages: [...get().pages.slice(0, -1), p] }),
  showToast: (toast) => {
    clearTimeout(toastTimer)
    set({ toast })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },
  setScrollToWorkout: (scrollToWorkout) => set({ scrollToWorkout }),
}))
