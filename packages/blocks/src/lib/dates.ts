/** Local-date helpers shared by calendar blocks (no external date library). */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return addDays(x, -((x.getDay() + 6) % 7)) // Monday
}

/** "2026-11-24", "2026-11-24T18:30", Date strings → { date: "2026-11-24", time: "18:30" } */
export function splitDateTime(value: unknown): { date: string; time: string } {
  const text = String(value ?? '')
  const m = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/.exec(text)
  if (m) return { date: m[1]!, time: m[2] ?? '' }
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return { date: '', time: '' }
  return { date: iso(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
}

export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
export const fromMinutes = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`
