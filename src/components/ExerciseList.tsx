import { useMemo, useRef, useState } from 'react'
import type { BodyPart, Category, Exercise } from '../types'
import { BODY_PARTS, CATEGORIES, bodyPartLabel, categoryLabel } from '../data/exercises'
import { useExercises, useWorkouts } from '../hooks/data'
import { MuscleIcon } from './MuscleIcon'
import { IconCheck, IconSearch, IconSort } from './Icons'
import { openMenu } from './overlay'
import { relativeDays } from '../lib/format'

type Sort = 'name' | 'frequency' | 'recent'

interface Props {
  onSelect: (e: Exercise) => void
  selected?: Set<string>
  /** element that scrolls, used for the A–Z index */
  scrollRoot?: React.RefObject<HTMLElement | null>
}

export function ExerciseList({ onSelect, selected, scrollRoot }: Props) {
  const lib = useExercises()
  const workouts = useWorkouts()
  const [q, setQ] = useState('')
  const [part, setPart] = useState<BodyPart | null>(null)
  const [cat, setCat] = useState<Category | null>(null)
  const [sort, setSort] = useState<Sort>('name')
  const sectionRefs = useRef(new Map<string, HTMLElement>())

  const usage = useMemo(() => {
    const m = new Map<string, { count: number; last: number }>()
    for (const w of workouts ?? [])
      for (const e of w.exercises) {
        const u = m.get(e.exerciseId) ?? { count: 0, last: 0 }
        u.count++
        u.last = Math.max(u.last, w.startedAt)
        m.set(e.exerciseId, u)
      }
    return m
  }, [workouts])

  const filtered = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    let list = lib.list.filter(
      (e) =>
        (!part || e.bodyPart === part) &&
        (!cat || e.category === cat) &&
        words.every((w) => e.name.toLowerCase().includes(w)),
    )
    if (sort === 'frequency') list = [...list].sort((a, b) => (usage.get(b.id)?.count ?? 0) - (usage.get(a.id)?.count ?? 0))
    if (sort === 'recent') list = [...list].sort((a, b) => (usage.get(b.id)?.last ?? 0) - (usage.get(a.id)?.last ?? 0))
    return list
  }, [lib.list, q, part, cat, sort, usage])

  const sections = useMemo(() => {
    if (sort !== 'name') return [{ letter: '', items: filtered }]
    const m = new Map<string, Exercise[]>()
    for (const e of filtered) {
      const l = /[a-z]/i.test(e.name[0]) ? e.name[0].toUpperCase() : '#'
      if (!m.has(l)) m.set(l, [])
      m.get(l)!.push(e)
    }
    return [...m.entries()].map(([letter, items]) => ({ letter, items }))
  }, [filtered, sort])

  const jump = (letter: string) => {
    const el = sectionRefs.current.get(letter)
    const root = scrollRoot?.current
    if (el && root) root.scrollTo({ top: el.offsetTop - 8 })
    else el?.scrollIntoView()
  }

  const subtitle = (e: Exercise) => {
    if (sort === 'frequency') return `${usage.get(e.id)?.count ?? 0} times`
    if (sort === 'recent') {
      const l = usage.get(e.id)?.last
      return l ? relativeDays(l) : 'Never'
    }
    return bodyPartLabel(e.bodyPart)
  }

  return (
    <div className="exlist">
      <label className="search">
        <IconSearch size={20} />
        <input
          type="search"
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search exercises"
        />
      </label>
      <div className="filter-row">
        <button
          className={`filter-btn${part ? ' on' : ''}`}
          onClick={(e) =>
            openMenu(e.currentTarget, [
              { label: 'Any Body Part', onClick: () => setPart(null), checked: !part },
              ...BODY_PARTS.map((b) => ({ label: b.label, onClick: () => setPart(b.id), checked: part === b.id })),
            ])
          }
        >
          {part ? bodyPartLabel(part) : 'Any Body Part'}
        </button>
        <button
          className={`filter-btn${cat ? ' on' : ''}`}
          onClick={(e) =>
            openMenu(e.currentTarget, [
              { label: 'Any Category', onClick: () => setCat(null), checked: !cat },
              ...CATEGORIES.map((c) => ({ label: c.label, onClick: () => setCat(c.id), checked: cat === c.id })),
            ])
          }
        >
          {cat ? categoryLabel(cat) : 'Any Category'}
        </button>
        <button
          className="filter-btn icon"
          aria-label="Sort"
          onClick={(e) =>
            openMenu(e.currentTarget, [
              { label: 'Name', onClick: () => setSort('name'), checked: sort === 'name' },
              { label: 'Frequency', onClick: () => setSort('frequency'), checked: sort === 'frequency' },
              { label: 'Last Performed', onClick: () => setSort('recent'), checked: sort === 'recent' },
            ])
          }
        >
          <IconSort size={20} />
        </button>
      </div>

      {filtered.length === 0 && <p className="empty">No exercises found.</p>}

      {sections.map((s) => (
        <section key={s.letter || 'all'} ref={(el) => void (el && sectionRefs.current.set(s.letter, el))}>
          {s.letter && <h3 className="section-letter">{s.letter}</h3>}
          {s.items.map((e) => {
            const sel = selected?.has(e.id)
            return (
              <button key={e.id} className={`ex-row${sel ? ' selected' : ''}`} onClick={() => onSelect(e)}>
                <MuscleIcon muscle={e.muscle} />
                <span className="ex-text">
                  <span className="ex-name">{e.name}</span>
                  <span className="ex-sub">{subtitle(e)}</span>
                </span>
                {sel && (
                  <span className="ex-sel">
                    <IconCheck size={18} />
                  </span>
                )}
              </button>
            )
          })}
        </section>
      ))}

      {sort === 'name' && sections.length > 3 && (
        <nav className="az-index" aria-label="Jump to letter">
          {sections.map((s) => (
            <button key={s.letter} onClick={() => jump(s.letter)}>
              {s.letter}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
