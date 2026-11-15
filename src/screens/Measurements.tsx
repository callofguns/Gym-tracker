import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useSettings } from '../stores/settings'
import { LineChart } from '../components/Charts'
import { IconClose, IconTrash } from '../components/Icons'
import { confirmDialog } from '../components/overlay'
import { fmtDate, toLocalInput } from '../lib/format'
import { kgTo, num, toKg, weightShort } from '../lib/units'
import { uid } from '../lib/id'
import type { MeasurementKind } from '../types'

export function Measurements({ onClose }: { onClose: () => void }) {
  const wu = useSettings((s) => s.weightUnit)
  const [kind, setKind] = useState<MeasurementKind>('bodyweight')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(() => toLocalInput(Date.now()).slice(0, 10))
  const list = useLiveQuery(() => db.measurements.where('kind').equals(kind).sortBy('date'), [kind]) ?? []

  const unit = kind === 'bodyweight' ? weightShort(wu) : '%'
  const show = (v: number) => (kind === 'bodyweight' ? num(kgTo(v, wu), 1) : num(v, 1))

  const add = async () => {
    const n = parseFloat(value)
    if (!Number.isFinite(n) || n <= 0) return
    if (kind === 'bodyfat' && n >= 100) return
    const [y, m, d] = date.split('-').map(Number)
    const t = new Date(y, m - 1, d, 12).getTime()
    await db.measurements.add({ id: uid(), kind, value: kind === 'bodyweight' ? toKg(n, wu) : n, date: t })
    setValue('')
  }

  return (
    <div className="page sheet-page">
      <header className="page-bar">
        <button className="icon-btn soft" onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>
        <div className="grow bar-title">Measurements</div>
        <span className="icon-btn" />
      </header>
      <div className="segmented page-seg">
        <button className={kind === 'bodyweight' ? 'on' : ''} onClick={() => setKind('bodyweight')}>
          Body Weight
        </button>
        <button className={kind === 'bodyfat' ? 'on' : ''} onClick={() => setKind('bodyfat')}>
          Body Fat %
        </button>
      </div>
      <div className="page-scroll">
        <div className="card">
          <div className="card-title">
            {kind === 'bodyweight' ? 'Body Weight' : 'Body Fat'} ({unit})
          </div>
          <LineChart points={list.map((m) => ({ t: m.date, v: kind === 'bodyweight' ? kgTo(m.value, wu) : m.value }))} format={(n) => num(n, 1)} />
        </div>

        <form
          className="card add-measure"
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
        >
          <div className="card-title">Add Entry</div>
          <div className="edit-meta">
            <label className="field">
              <span>{unit}</span>
              <input className="text-input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.0" />
            </label>
            <label className="field">
              <span>Date</span>
              <input className="text-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>
          <button className="big-btn blue" type="submit" disabled={!value}>
            Add
          </button>
        </form>

        {list.length > 0 && (
          <div className="card">
            <div className="card-title">History</div>
            {[...list].reverse().map((m) => (
              <div key={m.id} className="kv">
                <span>{fmtDate(m.date)}</span>
                <span className="kv-right">
                  <strong>
                    {show(m.value)} {unit}
                  </strong>
                  <button
                    className="icon-btn danger"
                    aria-label="Delete entry"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: 'Delete Entry?',
                        buttons: [
                          { label: 'Delete', variant: 'red', value: true },
                          { label: 'Cancel', variant: 'plain', value: false },
                        ],
                      })
                      if (ok) await db.measurements.delete(m.id)
                    }}
                  >
                    <IconTrash size={18} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
