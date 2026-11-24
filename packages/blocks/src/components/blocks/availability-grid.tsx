import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { statusTone } from '../ui/status-badge'
import { cn, getPath, toRows } from '../../lib/utils'
import { addDays, fromMinutes, iso, splitDateTime, toMinutes } from '../../lib/dates'

/** A free slot. Also carries the values under your own field names, so it can be sent as a new booking. */
export type Slot = { resource: string; date: string; time: string } & Record<string, string>

export type AvailabilityGridProps = {
  title?: string
  /** Existing bookings. */
  data?: unknown
  /** Comma separated (e.g. "Cancha 1, Cancha 2"). Empty: taken from the bookings. */
  resources?: string
  resourceField?: string
  /** Date or date-time of the booking. */
  dateField?: string
  /** Optional separate start time ("18:00"). */
  timeField?: string
  /** Optional length in minutes; defaults to one slot. */
  durationField?: string
  labelField?: string
  statusField?: string
  startTime?: string
  endTime?: string
  slotMinutes?: number
  loading?: boolean
  onSlotClick?: (slot: Slot) => void
  onBookingClick?: (row: Record<string, unknown>) => void
}

type Booking = { row: Record<string, unknown>; start: number; span: number; label: string; tone: string }

export function AvailabilityGrid({
  title, data, resources, resourceField = 'resource', dateField = 'date', timeField, durationField, labelField, statusField,
  startTime = '08:00', endTime = '23:00', slotMinutes = 60, loading, onSlotClick, onBookingClick,
}: AvailabilityGridProps) {
  const [day, setDay] = useState(() => new Date())
  const date = iso(day)
  const step = Math.max(5, slotMinutes || 60)
  const slots = useMemo(() => {
    const out: number[] = []
    for (let t = toMinutes(startTime); t < toMinutes(endTime); t += step) out.push(t)
    return out
  }, [startTime, endTime, step])

  const rows = toRows(data)
  const names = useMemo(() => {
    const listed = (resources ?? '').split(',').map((r) => r.trim()).filter(Boolean)
    if (listed.length) return listed
    return [...new Set(rows.map((r) => String(getPath(r, resourceField) ?? '')).filter(Boolean))].sort()
  }, [resources, rows, resourceField])

  const byResource = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const row of rows) {
      const dt = splitDateTime(getPath(row, dateField))
      if (dt.date !== date) continue
      const time = timeField ? String(getPath(row, timeField) ?? '').slice(0, 5) : dt.time
      if (!time) continue
      const minutes = durationField ? Number(getPath(row, durationField)) || step : step
      const status = statusField ? String(getPath(row, statusField) ?? '') : ''
      const b = {
        row,
        start: toMinutes(time),
        span: Math.max(1, Math.round(minutes / step)),
        label: (labelField && String(getPath(row, labelField) ?? '')) || 'Reservado',
        tone: status ? statusTone(status) : 'bg-primary/15 text-primary',
      }
      const key = String(getPath(row, resourceField) ?? '')
      map.set(key, [...(map.get(key) ?? []), b])
    }
    return map
  }, [rows, date, dateField, timeField, durationField, labelField, statusField, resourceField, step])

  const free = names.reduce((n, r) => n + slots.length - (byResource.get(r) ?? []).reduce((a, b) => a + b.span, 0), 0)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-5 pb-4">
        <div className="mr-auto">
          {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
          <p className="text-xs text-muted-foreground">{Math.max(0, free)} turnos libres</p>
        </div>
        <Button variant="ghost" className="size-8 px-0" onClick={() => setDay((d) => addDays(d, -1))} aria-label="Día anterior"><ChevronLeft className="size-4" /></Button>
        <input type="date" value={date} onChange={(e) => e.target.value && setDay(new Date(e.target.value + 'T12:00'))} className="h-8 rounded-[calc(var(--radius)-4px)] border border-border bg-transparent px-2 text-sm" aria-label="Fecha" />
        <Button variant="ghost" className="size-8 px-0" onClick={() => setDay((d) => addDays(d, 1))} aria-label="Día siguiente"><ChevronRight className="size-4" /></Button>
      </div>
      {loading ? (
        <Skeleton className="m-5 h-48" />
      ) : names.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">Indicá los recursos (canchas, salas, profesionales…) en las propiedades.</p>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <div className="grid min-w-max text-xs" style={{ gridTemplateColumns: `minmax(110px,max-content) repeat(${slots.length}, minmax(64px, 1fr))` }}>
            <div className="sticky left-0 z-10 bg-card" />
            {slots.map((t) => <div key={t} className="border-l border-border px-2 py-2 text-center tabular-nums text-muted-foreground">{fromMinutes(t)}</div>)}
            {names.map((name, ri) => {
              const bookings = byResource.get(name) ?? []
              const cells: ReactNode[] = []
              for (let i = 0; i < slots.length; ) {
                const t = slots[i]!
                const b = bookings.find((x) => x.start <= t && t < x.start + x.span * step)
                if (b) {
                  const span = Math.max(1, Math.min(b.span - Math.floor((t - b.start) / step), slots.length - i))
                  cells.push(
                    <div key={t} className="border-l border-t border-border p-1" style={{ gridColumn: `span ${span}` }}>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: ri * 0.03 + i * 0.01 }}
                        onClick={() => onBookingClick?.(b.row)}
                        className={cn('h-full min-h-9 w-full truncate rounded-md px-2 text-left font-medium', b.tone, !onBookingClick && 'cursor-default')}
                        title={b.label}
                      >
                        {b.label}
                      </motion.button>
                    </div>,
                  )
                  i += span
                } else {
                  cells.push(
                    <div key={t} className="border-l border-t border-border p-1">
                      <button
                        onClick={() => onSlotClick?.({ [resourceField]: name, [dateField]: date, ...(timeField ? { [timeField]: fromMinutes(t) } : {}), resource: name, date, time: fromMinutes(t) })}
                        className={cn('group grid h-full min-h-9 w-full place-items-center rounded-md transition-colors', onSlotClick ? 'hover:bg-primary/10' : 'cursor-default')}
                        aria-label={`${name} ${fromMinutes(t)} libre`}
                      >
                        {onSlotClick && <Plus className="size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />}
                      </button>
                    </div>,
                  )
                  i++
                }
              }
              return (
                <div key={name} className="contents">
                  <div className="sticky left-0 z-10 flex items-center border-t border-border bg-card px-4 font-medium">{name}</div>
                  {cells}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
