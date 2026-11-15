/** 90 -> "1:30", 3725 -> "1:02:05" */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const ss = String(sec).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}

/** Short duration for cards: "12s", "3m", "1h 5m" */
export function shortDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h}h ${rm}m` : `${h}h`
}

const DAY = 86400000

export function startOfDay(t: number): number {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Monday-based week start. */
export function startOfWeek(t: number): number {
  const d = new Date(startOfDay(t))
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return d.getTime()
}

export function relativeDays(t: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 14) return '1 week ago'
  if (days < 31) return `${Math.floor(days / 7)} weeks ago`
  const months = Math.floor(days / 30)
  return months <= 1 ? '1 month ago' : `${months} months ago`
}

export const fmtLongDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })

export const fmtDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export const fmtMonthHeader = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase()

export const fmtShortMD = (t: number) => {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function timeOfDayName(t = Date.now()): string {
  const h = new Date(t).getHours()
  if (h < 5) return 'Night Workout'
  if (h < 12) return 'Morning Workout'
  if (h < 17) return 'Afternoon Workout'
  if (h < 21) return 'Evening Workout'
  return 'Night Workout'
}

/** For <input type="datetime-local"> */
export function toLocalInput(t: number): string {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
