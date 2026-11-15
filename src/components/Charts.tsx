import { useId } from 'react'

export interface BarDatum {
  label: string
  value: number
}

/** Vertical bar chart with an optional goal line (Workouts Per Week style). */
export function BarChart({ data, goal, format = String }: { data: BarDatum[]; goal?: number | null; format?: (n: number) => string }) {
  const W = 320
  const H = 170
  const padL = 4
  const padR = 34
  const padT = 12
  const padB = 26
  const max = Math.max(1, goal ?? 0, ...data.map((d) => d.value))
  const niceMax = max <= 5 ? Math.ceil(max) : max
  const iw = W - padL - padR
  const ih = H - padT - padB
  const bw = Math.min(22, (iw / data.length) * 0.45)
  const y = (v: number) => padT + ih - (v / niceMax) * ih
  const grid = 4
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Bar chart">
      {Array.from({ length: grid + 1 }, (_, i) => (
        <line key={i} x1={padL} x2={W - padR} y1={padT + (ih / grid) * i} y2={padT + (ih / grid) * i} className="grid" />
      ))}
      {data.map((d, i) => {
        const cx = padL + (iw / data.length) * (i + 0.5)
        const h = (d.value / niceMax) * ih
        return (
          <g key={i}>
            {d.value > 0 && <rect x={cx - bw / 2} y={padT + ih - h} width={bw} height={h} rx={3} className="bar" />}
            <text x={cx} y={H - 6} className="axis" textAnchor="middle">
              {d.label}
            </text>
          </g>
        )
      })}
      {goal ? (
        <>
          <line x1={padL} x2={W - padR} y1={y(goal)} y2={y(goal)} className="goal" />
          <text x={W - padR + 6} y={y(goal) + 4} className="goal-label">
            {goal}
          </text>
        </>
      ) : (
        <text x={W - padR + 6} y={padT + 4} className="axis">
          {format(niceMax)}
        </text>
      )}
      <text x={W - padR + 6} y={padT + ih + 4} className="axis">
        0
      </text>
    </svg>
  )
}

export interface Point {
  t: number
  v: number
}

/** Simple line chart over time. */
export function LineChart({ points, format = (n: number) => String(Math.round(n)) }: { points: Point[]; format?: (n: number) => string }) {
  const gid = useId()
  if (points.length === 0) return <div className="chart-empty">No data yet</div>
  const W = 320
  const H = 170
  const padL = 4
  const padR = 44
  const padT = 14
  const padB = 26
  const iw = W - padL - padR
  const ih = H - padT - padB
  const ts = points.map((p) => p.t)
  const vs = points.map((p) => p.v)
  const t0 = Math.min(...ts)
  const t1 = Math.max(...ts)
  let v0 = Math.min(...vs)
  let v1 = Math.max(...vs)
  if (v0 === v1) {
    v0 = v0 * 0.9
    v1 = v1 * 1.1 || 1
  }
  const pad = (v1 - v0) * 0.1
  v0 -= pad
  v1 += pad
  const x = (t: number) => padL + (t1 === t0 ? iw / 2 : ((t - t0) / (t1 - t0)) * iw)
  const y = (v: number) => padT + ih - ((v - v0) / (v1 - v0)) * ih
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const area = `${d} L${x(points[points.length - 1].t)},${padT + ih} L${x(points[0].t)},${padT + ih} Z`
  const fmtD = (t: number) => {
    const dt = new Date(t)
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Line chart">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--chart-line)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--chart-line)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={padL} x2={W - padR} y1={padT + (ih / 4) * i} y2={padT + (ih / 4) * i} className="grid" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} className="line" />
      {points.length <= 40 && points.map((p, i) => <circle key={i} cx={x(p.t)} cy={y(p.v)} r={3} className="dot" />)}
      <text x={W - padR + 6} y={padT + 4} className="axis">
        {format(v1)}
      </text>
      <text x={W - padR + 6} y={padT + ih + 4} className="axis">
        {format(v0)}
      </text>
      <text x={padL} y={H - 6} className="axis">
        {fmtD(t0)}
      </text>
      {t1 !== t0 && (
        <text x={W - padR} y={H - 6} className="axis" textAnchor="end">
          {fmtD(t1)}
        </text>
      )}
    </svg>
  )
}
