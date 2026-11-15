import { IconBackspace, IconKeyboardHide } from './Icons'

interface Props {
  allowDot: boolean
  onKey: (k: string) => void
  onBackspace: () => void
  onStep: (dir: 1 | -1) => void
  onNext: () => void
  onHide: () => void
  nextLabel: string
}

/** In-app number pad, so every phone looks the same and the native keyboard never covers the sets. */
export function Keypad({ allowDot, onKey, onBackspace, onStep, onNext, onHide, nextLabel }: Props) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0']
  const press = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault()
    fn()
  }
  return (
    <div className="bottom-panel keypad" onPointerDown={(e) => e.preventDefault()}>
      <div className="keypad-grid">
        {keys.map((k) => (
          <button
            key={k}
            className="key"
            disabled={k === '.' && !allowDot}
            onPointerDown={press(() => onKey(k))}
          >
            {k}
          </button>
        ))}
        <button className="key" aria-label="Delete" onPointerDown={press(onBackspace)}>
          <IconBackspace size={26} />
        </button>
      </div>
      <div className="panel-side">
        <button className="side-btn" aria-label="Hide keypad" onPointerDown={press(onHide)}>
          <IconKeyboardHide size={24} />
        </button>
        <div className="side-btn split">
          <button aria-label="Decrease" onPointerDown={press(() => onStep(-1))}>
            −
          </button>
          <button aria-label="Increase" onPointerDown={press(() => onStep(1))}>
            +
          </button>
        </div>
        <button className="side-btn blue tall" onPointerDown={press(onNext)}>
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
