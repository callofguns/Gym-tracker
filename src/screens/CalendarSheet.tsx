import { useEffect, useMemo, useRef } from 'react'
import { useWorkouts } from '../hooks/data'
import { useUI } from '../stores/ui'
import { IconCheck, IconClose } from '../components/Icons'
import { startOfDay } from '../lib/format'

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function CalendarSheet({ onClose }: { onClose: () => void }) {
  const workouts = useWorkouts() ?? []
  const scrollRef = useRef<HTMLDivElement>(null)

  const byDay = useMemo(() => {
    const m = new Map<number, string>()
    // workouts are newest first; keep the earliest of the day
    for (const w of workouts) m.set(startOfDay(w.startedAt), w.id)
    return m
  }, [workouts])

  const months = useMemo(() => {
    const now = new Date()
    const first = workouts.length ? new Date(workouts[workouts.length - 1].startedAt) : now
    const start = new Date(first.getFullYear(), first.getMonth() - (workouts.length ? 0 : 2), 1)
    const out: Date[] = []
    for (let d = new Date(start); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) out.push(d)
    if (out.length < 3) {
      const extra = 3 - out.length
      for (let i = 1; i <= extra; i++) out.unshift(new Date(start.getFullYear(), start.getMonth() - i, 1))
    }
    return out
  }, [workouts])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [months.length])

  const today = startOfDay(Date.now())

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="calendar" onClick={(e) => e.stopPropagation()}>
        <div className="preview-head">
          <button className="icon-btn soft" onClick={onClose} aria-label="Close">
            <IconClose size={18} />
          </button>
          <h2 className="dialog-title">Calendar</h2>
          <span className="icon-btn" />
        </div>
        <div className="dow-row">
          {DOW.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="cal-scroll" ref={scrollRef}>
          {months.map((m) => {
            const lead = (m.getDay() + 6) % 7
            const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
            return (
              <div key={m.getTime()} className="cal-month">
                <h3>{m.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</h3>
                <div className="cal-grid">
                  {Array.from({ length: lead }, (_, i) => (
                    <span key={'b' + i} />
                  ))}
                  {Array.from({ length: days }, (_, i) => {
                    const t = new Date(m.getFullYear(), m.getMonth(), i + 1).getTime()
                    const wid = byDay.get(t)
                    const cls = ['cal-day', wid ? 'has' : '', t === today ? 'today' : '', t > today ? 'future' : ''].join(' ')
                    return (
                      <button
                        key={i}
                        className={cls}
                        disabled={!wid}
                        onClick={() => {
                          if (!wid) return
                          useUI.getState().setScrollToWorkout(wid)
                          onClose()
                        }}
                      >
                        {i + 1}
                        {wid && (
                          <span className="cal-check">
                            <IconCheck size={11} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
