import type { Muscle } from '../types'

const BACK_VIEW: Muscle[] = ['upper_back', 'lats', 'lower_back', 'triceps', 'hamstrings', 'glutes', 'calves']

type Region = { key: string; el: React.ReactNode }

/** A small body figure with the target muscle highlighted. Front or back view depending on the muscle. */
export function MuscleIcon({ muscle, size = 44 }: { muscle: Muscle; size?: number }) {
  const back = BACK_VIEW.includes(muscle)
  const all = muscle === 'full_body'
  const on = (...ms: Muscle[]) => (all || ms.includes(muscle) ? 'var(--muscle)' : 'var(--figure)')

  const pair = (key: string, x: number, mirrorX: number, y: number, w: number, h: number, rx: number, fill: string): Region[] => [
    { key: key + 'l', el: <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} /> },
    { key: key + 'r', el: <rect x={mirrorX} y={y} width={w} height={h} rx={rx} fill={fill} /> },
  ]

  const regions: Region[] = [
    { key: 'head', el: <circle cx={30} cy={9} r={6.5} fill="var(--figure)" /> },
    { key: 'neck', el: <rect x={27} y={14.5} width={6} height={5} rx={2} fill="var(--figure)" /> },
    { key: 'deltl', el: <ellipse cx={16.8} cy={23.5} rx={4.8} ry={4.6} fill={on('shoulders')} /> },
    { key: 'deltr', el: <ellipse cx={43.2} cy={23.5} rx={4.8} ry={4.6} fill={on('shoulders')} /> },
    ...pair('upperarm', 10.8, 43.2, 28, 6, 13.5, 3, back ? on('triceps') : on('biceps')),
    ...pair('forearm', 8.6, 45.9, 42.5, 5.5, 14, 2.75, on('forearms')),
  ]

  if (!back) {
    regions.push(
      ...pair('chest', 20.6, 30.4, 19.5, 9, 10.5, 3, on('chest')),
      { key: 'abs', el: <rect x={24.2} y={31} width={11.6} height={16.5} rx={2.5} fill={on('abs')} /> },
      ...pair('obl', 20.6, 36.4, 31, 3, 15, 1.5, on('obliques')),
      { key: 'pelvis', el: <rect x={21} y={48.5} width={18} height={6.5} rx={2.5} fill="var(--figure)" /> },
      ...pair('thigh', 21, 30.5, 56, 8.5, 20.5, 3.5, on('quads')),
      ...pair('calf', 22, 31, 77.5, 7, 17, 3, 'var(--figure)'),
    )
  } else {
    regions.push(
      { key: 'traps', el: <rect x={20.6} y={19.5} width={18.8} height={10} rx={3} fill={on('upper_back')} /> },
      { key: 'latl', el: <path d="M20.6 30.8h8.6v9.6h-6.2a2.4 2.4 0 0 1-2.4-2.4z" fill={on('lats')} /> },
      { key: 'latr', el: <path d="M30.8 30.8h8.6v7.2a2.4 2.4 0 0 1-2.4 2.4h-6.2z" fill={on('lats')} /> },
      { key: 'lower', el: <rect x={23.5} y={41.4} width={13} height={6.6} rx={2} fill={on('lower_back')} /> },
      ...pair('glute', 21, 30.3, 49, 8.7, 9, 3.5, on('glutes')),
      ...pair('ham', 21, 30.5, 59, 8.5, 17.5, 3.5, on('hamstrings')),
      ...pair('calf', 22, 31, 77.5, 7, 17, 3, on('calves')),
    )
  }

  return (
    <svg width={size} height={size} viewBox="-18 -1.5 96 98" aria-hidden="true" className="muscle-icon">
      {regions.map((r) => (
        <g key={r.key}>{r.el}</g>
      ))}
      {muscle === 'cardio' && (
        <path
          d="M30 44.5c-5.5-4.2-9.3-7.3-9.3-11.4a4.8 4.8 0 0 1 9.3-1.7 4.8 4.8 0 0 1 9.3 1.7c0 4.1-3.8 7.2-9.3 11.4z"
          fill="var(--muscle)"
          stroke="var(--bg)"
          strokeWidth={1.2}
        />
      )}
    </svg>
  )
}
