import { useWorkout } from '../stores/workout'
import { IconKeyboardHide } from './Icons'

/** Rest timer controls shown in the bottom panel area (same spot as the keypad). */
export function RestPanel({ onHide }: { onHide: () => void }) {
  const timer = useWorkout((s) => s.timer)
  const { pauseTimer, resumeTimer, adjustTimer, resetTimer, clearTimer } = useWorkout.getState()
  if (!timer) return null
  const paused = timer.endsAt == null
  return (
    <div className="bottom-panel rest-panel">
      <div className="rest-main">
        <button className="pause-circle" onClick={() => (paused ? resumeTimer() : pauseTimer())}>
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>
      <div className="panel-side">
        <button className="side-btn" aria-label="Hide timer controls" onClick={onHide}>
          <IconKeyboardHide size={24} />
        </button>
        <div className="side-btn split">
          <button aria-label="Minus 15 seconds" onClick={() => adjustTimer(-15)}>
            −
          </button>
          <button aria-label="Plus 15 seconds" onClick={() => adjustTimer(15)}>
            +
          </button>
        </div>
        <button className="side-btn" onClick={resetTimer}>
          Reset
        </button>
        <button
          className="side-btn blue"
          onClick={() => {
            clearTimer()
            onHide()
          }}
        >
          Skip
        </button>
      </div>
    </div>
  )
}
