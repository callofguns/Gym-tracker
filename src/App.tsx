import { useEffect, useRef } from 'react'
import { useUI, type Page, type Tab } from './stores/ui'
import { useSettings } from './stores/settings'
import { useWorkout } from './stores/workout'
import { restDoneAlert } from './lib/sound'
import { OverlayHost } from './components/overlay'
import { IconDumbbell, IconGear, IconHistory, IconPerson, IconPlus } from './components/Icons'
import { StartWorkout } from './screens/StartWorkout'
import { History } from './screens/History'
import { Exercises } from './screens/Exercises'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { ActiveWorkout } from './screens/ActiveWorkout'
import { Summary } from './screens/Summary'
import { TemplateEditor } from './screens/TemplateEditor'
import { TemplatePreview } from './screens/TemplatePreview'
import { WorkoutDetail } from './screens/WorkoutDetail'
import { WorkoutEdit } from './screens/WorkoutEdit'
import { ExerciseDetail } from './screens/ExerciseDetail'
import { Measurements } from './screens/Measurements'
import { CalendarSheet } from './screens/CalendarSheet'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <IconPerson size={28} /> },
  { id: 'history', label: 'History', icon: <IconHistory size={28} /> },
  { id: 'start', label: 'Start Workout', icon: <IconPlus size={28} /> },
  { id: 'exercises', label: 'Exercises', icon: <IconDumbbell size={28} /> },
  { id: 'settings', label: 'Settings', icon: <IconGear size={28} /> },
]

function useTheme() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#000000' : '#ffffff')
  }, [theme])
}

/** Fires the alert when a rest timer runs out, wherever you are in the app. */
function useRestAlarm() {
  useEffect(() => {
    const id = setInterval(() => {
      const { timer, clearTimer } = useWorkout.getState()
      if (timer?.endsAt != null && Date.now() >= timer.endsAt) {
        clearTimer()
        restDoneAlert()
      }
    }, 300)
    return () => clearInterval(id)
  }, [])
}

function PageView({ page }: { page: Page }) {
  const pop = useUI((s) => s.pop)
  switch (page.kind) {
    case 'templateEditor':
      return <TemplateEditor template={page.template} onClose={pop} />
    case 'templatePreview':
      return <TemplatePreview template={page.template} example={page.example} onClose={pop} />
    case 'workoutDetail':
      return <WorkoutDetail workoutId={page.workoutId} onClose={pop} />
    case 'workoutEdit':
      return <WorkoutEdit workout={page.workout} onClose={pop} />
    case 'exerciseDetail':
      return <ExerciseDetail exerciseId={page.exerciseId} onClose={pop} />
    case 'measurements':
      return <Measurements onClose={pop} />
    case 'calendar':
      return <CalendarSheet onClose={pop} />
    case 'summary':
      return <Summary workoutId={page.workoutId} templateId={page.templateId} onClose={pop} />
  }
}

export default function App() {
  useTheme()
  useRestAlarm()
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)
  const pages = useUI((s) => s.pages)
  const toast = useUI((s) => s.toast)
  const hasWorkout = useWorkout((s) => !!s.active)
  const minimized = useWorkout((s) => s.minimized)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [tab])

  return (
    <div className={`app${hasWorkout && minimized ? ' has-mini' : ''}`}>
      <main className="tab-scroll" ref={mainRef}>
        {tab === 'start' && <StartWorkout />}
        {tab === 'history' && <History />}
        {tab === 'exercises' && <Exercises scrollRoot={mainRef} />}
        {tab === 'profile' && <Profile />}
        {tab === 'settings' && <Settings />}
      </main>

      <nav className="tab-bar" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} className={`tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {pages.map((p, i) => (
        <div key={i} className="page-layer">
          <PageView page={p} />
        </div>
      ))}

      <ActiveWorkout />
      <OverlayHost />
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}
