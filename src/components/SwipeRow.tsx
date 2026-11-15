import { useRef, useState, type ReactNode } from 'react'

const OPEN = 88

/** Swipe left to reveal a red Delete button. */
export function SwipeRow({ children, onDelete, className = '' }: { children: ReactNode; onDelete: () => void; className?: string }) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef<{ x: number; y: number; base: number; decided: boolean; horiz: boolean } | null>(null)
  const moved = useRef(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, base: dx, decided: false, horiz: false }
    moved.current = false
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const mx = e.clientX - s.x
    const my = e.clientY - s.y
    if (!s.decided) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return
      s.decided = true
      s.horiz = Math.abs(mx) > Math.abs(my)
      if (s.horiz) {
        setDragging(true)
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      }
    }
    if (!s.horiz) return
    moved.current = true
    setDx(Math.min(0, Math.max(-OPEN * 1.6, s.base + mx)))
  }
  const onPointerUp = () => {
    const s = start.current
    start.current = null
    setDragging(false)
    if (!s?.horiz) return
    if (dx < -OPEN * 1.4) {
      setDx(0)
      onDelete()
    } else setDx(dx < -OPEN / 2 ? -OPEN : 0)
  }

  return (
    <div className={`swipe ${className}`}>
      <button className="swipe-delete" style={{ width: Math.max(OPEN, -dx) }} onClick={onDelete} tabIndex={dx ? 0 : -1}>
        Delete
      </button>
      <div
        className="swipe-content"
        style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform .2s ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (moved.current) {
            e.stopPropagation()
            moved.current = false
          } else if (dx !== 0) {
            e.stopPropagation()
            setDx(0)
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
