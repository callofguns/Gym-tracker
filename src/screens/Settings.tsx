import { useSettings, type Theme } from '../stores/settings'
import { useWorkout } from '../stores/workout'
import { useUI } from '../stores/ui'
import { confirmDialog, pickRest } from '../components/overlay'
import { resetAllData } from '../db'
import { clock } from '../lib/format'
import { IconChevronRight } from '../components/Icons'

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Settings() {
  const s = useSettings()

  const reset = async () => {
    const ok = await confirmDialog({
      title: 'Reset All Data?',
      message: 'This permanently deletes every workout, template, custom exercise and measurement on this device. This cannot be undone.',
      buttons: [
        { label: 'Delete Everything', variant: 'red', value: true },
        { label: 'Cancel', variant: 'plain', value: false },
      ],
    })
    if (!ok) return
    await resetAllData()
    useWorkout.getState().end()
    s.reset()
    useUI.getState().showToast('All data deleted')
  }

  return (
    <div className="tab-page">
      <h1 className="page-title">Settings</h1>

      <h2 className="group-title">Units</h2>
      <div className="group">
        <div className="group-row">
          <span>Weight</span>
          <Segmented value={s.weightUnit} onChange={(v) => s.set({ weightUnit: v })} options={[{ v: 'kg', label: 'kg' }, { v: 'lb', label: 'lbs' }]} />
        </div>
        <div className="group-row">
          <span>Distance</span>
          <Segmented value={s.distanceUnit} onChange={(v) => s.set({ distanceUnit: v })} options={[{ v: 'km', label: 'km' }, { v: 'mi', label: 'miles' }]} />
        </div>
      </div>

      <h2 className="group-title">Workout</h2>
      <div className="group">
        <button
          className="group-row"
          onClick={async () => {
            const v = await pickRest('Default Rest Timer', s.defaultRest)
            if (v != null) s.set({ defaultRest: v })
          }}
        >
          <span>Default Rest Timer</span>
          <span className="row-value">
            {s.defaultRest ? clock(s.defaultRest) : 'Off'} <IconChevronRight size={16} />
          </span>
        </button>
      </div>
      <p className="group-note">Used for new sets. You can still change the rest for any set by tapping its timer bar.</p>

      <h2 className="group-title">Appearance</h2>
      <div className="group">
        <div className="group-row">
          <span>Theme</span>
          <Segmented<Theme>
            value={s.theme}
            onChange={(v) => s.set({ theme: v })}
            options={[
              { v: 'system', label: 'System' },
              { v: 'dark', label: 'Dark' },
              { v: 'light', label: 'Light' },
            ]}
          />
        </div>
      </div>

      <h2 className="group-title">Data</h2>
      <div className="group">
        <button className="group-row danger" onClick={reset}>
          <span>Reset All Data</span>
        </button>
      </div>
      <p className="group-note">Your data is saved on this device only. Cloud sync is coming in a later version.</p>

      <p className="version">Liftlog v{__APP_VERSION__}</p>
    </div>
  )
}
