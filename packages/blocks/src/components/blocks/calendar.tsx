import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { statusTone } from '../ui/status-badge'
import { cn, getPath, toRows } from '../../lib/utils'
import { addDays, iso, splitDateTime, startOfWeek } from '../../lib/dates'

export type CalendarProps = {
  title?: string
  data?: unknown
  /** Date or date-time of each event. */
  dateField?: string
  /** Optional separate time ("18:30"). */
  timeField?: string
  titleField?: string
  statusField?: string
  view?: 'week' | 'month'
  loading?: boolean
  onEventClick?: (row: Record<string, unknown>) => void
  onDayClick?: (day: { date: string }) => void
}

type Ev = { row: Record<string, unknown>; date: string; time: string; title: string; tone: string }

export function Calendar({ title, data, dateField = 'date', timeField, titleField = 'title', statusField, view: initialView = 'week', loading, onEventClick, onDayClick }: CalendarProps) {
  const [view, setView] = useState(initialView)
  const [anchor, setAnchor] = useState(() => new Date())
  const today = iso(new Date())
  const uid = useId()

  const events = useMemo(() => {
    const map = new Map<string, Ev[]>()
    for (const row of toRows(data)) {
      const dt = splitDateTime(getPath(row, dateField))
      if (!dt.date) continue
      const time = timeField ? String(getPath(row, timeField) ?? '').slice(0, 5) : dt.time
      const status = statusField ? String(getPath(row, statusField) ?? '') : ''
      const ev = { row, date: dt.date, time, title: String(getPath(row, titleField) ?? ''), tone: status ? statusTone(status) : 'bg-primary/10 text-primary' }
      map.set(dt.date, [...(map.get(dt.date) ?? []), ev].sort((a, b) => a.time.localeCompare(b.time)))
    }
    return map
  }, [data, dateField, timeField, titleField, statusField])

  const days = useMemo(() => {
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [view, anchor])

  const move = (dir: number) => setAnchor((a) => (view === 'week' ? addDays(a, dir * 7) : new Date(a.getFullYear(), a.getMonth() + dir, 1)))
  const label = view === 'week'
    ? `${days[0]!.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${days[6]!.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
    : anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-5 pb-4">
        {title && <h3 className="mr-auto font-semibold tracking-tight">{title}</h3>}
        <span className="text-sm font-medium capitalize text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="size-8 px-0" onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft className="size-4" /></Button>
          <Button variant="outline" className="h-8 px-3 text-xs" onClick={() => setAnchor(new Date())}>Hoy</Button>
          <Button variant="ghost" className="size-8 px-0" onClick={() => move(1)} aria-label="Siguiente"><ChevronRight className="size-4" /></Button>
        </div>
        <div className="flex rounded-[calc(var(--radius)-4px)] bg-muted p-0.5 text-xs">
          {(['week', 'month'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn('relative rounded-[calc(var(--radius)-6px)] px-2.5 py-1', view === v ? 'text-foreground' : 'text-muted-foreground')}>
              {view === v && <motion.span layoutId={`cal-view-${uid}`} className="absolute inset-0 rounded-[inherit] bg-card shadow-sm" />}
              <span className="relative">{v === 'week' ? 'Semana' : 'Mes'}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 border-t border-border text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        {days.slice(0, 7).map((d) => <div key={d.getDay()} className="py-2">{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>)}
      </div>
      {loading ? (
        <Skeleton className="m-5 h-48" />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${view}-${iso(days[0]!)}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 border-t border-border"
          >
            {days.map((d) => {
              const key = iso(d)
              const list = events.get(key) ?? []
              const outside = view === 'month' && d.getMonth() !== anchor.getMonth()
              const max = view === 'week' ? 6 : 3
              return (
                <div
                  key={key}
                  onClick={onDayClick ? () => onDayClick({ date: key }) : undefined}
                  className={cn('min-w-0 border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0', view === 'week' ? 'min-h-40' : 'min-h-24', outside && 'bg-muted/40', onDayClick && 'cursor-pointer hover:bg-muted/50')}
                >
                  <span className={cn('mb-1 inline-grid size-6 place-items-center rounded-full text-xs tabular-nums', key === today ? 'bg-primary font-semibold text-primary-foreground' : outside ? 'text-muted-foreground/60' : 'text-muted-foreground')}>{d.getDate()}</span>
                  <div className="grid gap-1">
                    {list.slice(0, max).map((ev, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(ev.row) }}
                        className={cn('truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-transform hover:scale-[1.02]', ev.tone, !onEventClick && 'cursor-default')}
                        title={`${ev.time} ${ev.title}`}
                      >
                        {ev.time && <span className="mr-1 tabular-nums opacity-70">{ev.time}</span>}
                        {ev.title}
                      </button>
                    ))}
                    {list.length > max && <span className="px-1.5 text-[11px] text-muted-foreground">+{list.length - max} más</span>}
                  </div>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </Card>
  )
}
