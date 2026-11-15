import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { clock } from '../lib/format'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
  checked?: boolean
}

export interface DialogButtonSpec<T> {
  label: string
  sub?: string
  variant: 'green' | 'red' | 'blue' | 'plain'
  value: T
}

interface DialogSpec {
  emoji?: string
  title: string
  message?: string
  buttons: DialogButtonSpec<unknown>[]
  resolve: (v: unknown) => void
}

interface PromptSpec {
  title: string
  value: string
  placeholder?: string
  inputType?: 'text' | 'number' | 'datetime-local'
  resolve: (v: string | null) => void
}

interface RestSpec {
  title: string
  value: number
  resolve: (v: number | null) => void
}

interface OverlayState {
  menu: { rect: DOMRect; items: MenuItem[] } | null
  dialog: DialogSpec | null
  prompt: PromptSpec | null
  rest: RestSpec | null
}

const useOverlay = create<OverlayState>()(() => ({ menu: null, dialog: null, prompt: null, rest: null }))

export function openMenu(anchor: Element, items: MenuItem[]) {
  useOverlay.setState({ menu: { rect: anchor.getBoundingClientRect(), items } })
}

export function confirmDialog<T>(spec: Omit<DialogSpec, 'resolve' | 'buttons'> & { buttons: DialogButtonSpec<T>[] }): Promise<T | null> {
  return new Promise((resolve) =>
    useOverlay.setState({ dialog: { ...spec, resolve: resolve as (v: unknown) => void } as DialogSpec }),
  )
}

export function promptDialog(spec: Omit<PromptSpec, 'resolve'>): Promise<string | null> {
  return new Promise((resolve) => useOverlay.setState({ prompt: { ...spec, resolve } }))
}

export function pickRest(title: string, value: number): Promise<number | null> {
  return new Promise((resolve) => useOverlay.setState({ rest: { title, value, resolve } }))
}

function MenuView() {
  const menu = useOverlay((s) => s.menu)
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!menu || !ref.current) return setPos(null)
    const m = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = menu.rect.right - m.width
    left = Math.max(12, Math.min(left, vw - m.width - 12))
    let top = menu.rect.bottom + 6
    if (top + m.height > vh - 12) top = Math.max(12, menu.rect.top - m.height - 6)
    setPos({ top, left })
  }, [menu])

  if (!menu) return null
  const close = () => useOverlay.setState({ menu: null })
  return (
    <div className="menu-backdrop" onClick={close}>
      <div
        ref={ref}
        className="menu"
        role="menu"
        style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {menu.items.map((it, i) => (
          <button
            key={i}
            role="menuitem"
            className={`menu-item${it.danger ? ' danger' : ''}`}
            onClick={() => {
              close()
              it.onClick()
            }}
          >
            {it.icon && <span className="menu-icon">{it.icon}</span>}
            <span className="menu-label">{it.label}</span>
            {it.checked && <span className="menu-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function DialogView() {
  const d = useOverlay((s) => s.dialog)
  if (!d) return null
  const done = (v: unknown) => {
    useOverlay.setState({ dialog: null })
    d.resolve(v)
  }
  return (
    <div className="dialog-backdrop" onClick={() => done(null)}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {d.emoji && <div className="dialog-emoji">{d.emoji}</div>}
        <h2 className="dialog-title">{d.title}</h2>
        {d.message && <p className="dialog-msg">{d.message}</p>}
        <div className="dialog-buttons">
          {d.buttons.map((b, i) => (
            <button key={i} className={`dlg-btn dlg-${b.variant}`} onClick={() => done(b.value)}>
              <span>{b.label}</span>
              {b.sub && <small>{b.sub}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PromptView() {
  const p = useOverlay((s) => s.prompt)
  const [val, setVal] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (p) {
      setVal(p.value)
      setTimeout(() => inputRef.current?.select(), 50)
    }
  }, [p])
  if (!p) return null
  const done = (v: string | null) => {
    useOverlay.setState({ prompt: null })
    p.resolve(v)
  }
  return (
    <div className="dialog-backdrop" onClick={() => done(null)}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          done(val)
        }}
      >
        <h2 className="dialog-title">{p.title}</h2>
        <input
          ref={inputRef}
          className="text-input"
          type={p.inputType ?? 'text'}
          inputMode={p.inputType === 'number' ? 'decimal' : undefined}
          value={val}
          placeholder={p.placeholder}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
        />
        <div className="dialog-buttons row">
          <button type="button" className="dlg-btn dlg-plain" onClick={() => done(null)}>
            Cancel
          </button>
          <button type="submit" className="dlg-btn dlg-blue">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

const REST_PRESETS = [0, 30, 45, 60, 90, 120, 150, 180, 240, 300]

function RestView() {
  const r = useOverlay((s) => s.rest)
  const [val, setVal] = useState(90)
  useEffect(() => {
    if (r) setVal(r.value)
  }, [r])
  if (!r) return null
  const done = (v: number | null) => {
    useOverlay.setState({ rest: null })
    r.resolve(v)
  }
  return (
    <div className="dialog-backdrop" onClick={() => done(null)}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">{r.title}</h2>
        <div className="rest-stepper">
          <button className="step-btn" onClick={() => setVal((v) => Math.max(0, v - 15))} aria-label="Minus 15 seconds">
            −15s
          </button>
          <div className="rest-value">{val === 0 ? 'Off' : clock(val)}</div>
          <button className="step-btn" onClick={() => setVal((v) => v + 15)} aria-label="Plus 15 seconds">
            +15s
          </button>
        </div>
        <div className="chip-grid">
          {REST_PRESETS.map((p) => (
            <button key={p} className={`chip${p === val ? ' on' : ''}`} onClick={() => setVal(p)}>
              {p === 0 ? 'Off' : clock(p)}
            </button>
          ))}
        </div>
        <div className="dialog-buttons row">
          <button className="dlg-btn dlg-plain" onClick={() => done(null)}>
            Cancel
          </button>
          <button className="dlg-btn dlg-blue" onClick={() => done(val)}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function OverlayHost() {
  return (
    <>
      <MenuView />
      <DialogView />
      <PromptView />
      <RestView />
    </>
  )
}
