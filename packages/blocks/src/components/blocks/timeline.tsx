import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { getPath, toRows } from '../../lib/utils'
import { StatusBadge } from '../ui/status-badge'

export type TimelineProps = {
  title?: string
  data?: unknown
  titleField?: string
  descriptionField?: string
  dateField?: string
  statusField?: string
  /** Newest first by default. */
  order?: 'desc' | 'asc'
  limit?: number
  loading?: boolean
  onItemClick?: (row: Record<string, unknown>) => void
}

function when(value: unknown) {
  if (value === undefined || value === null || value === '') return ''
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(text + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const d = new Date(text)
  if (Number.isNaN(d.getTime())) return text
  return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function Timeline({ title, data, titleField = 'title', descriptionField, dateField, statusField, order = 'desc', limit = 8, loading, onItemClick }: TimelineProps) {
  const rows = useMemo(() => {
    const list = [...toRows(data)]
    if (dateField) list.sort((a, b) => String(getPath(a, dateField) ?? '').localeCompare(String(getPath(b, dateField) ?? '')) * (order === 'desc' ? -1 : 1))
    return list.slice(0, limit)
  }, [data, dateField, order, limit])

  return (
    <Card className="p-5">
      {title && <h3 className="mb-4 font-semibold tracking-tight">{title}</h3>}
      {loading ? (
        <div className="grid gap-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin actividad</p>
      ) : (
        <ol className="relative grid gap-5 border-l border-border pl-5">
          {rows.map((row, i) => (
            <motion.li
              key={String(getPath(row, 'id') ?? i)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={onItemClick ? 'cursor-pointer' : undefined}
              onClick={onItemClick ? () => onItemClick(row) : undefined}
            >
              <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary ring-4 ring-card" />
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{String(getPath(row, titleField) ?? '')}</p>
                {statusField && getPath(row, statusField) !== undefined && <StatusBadge value={getPath(row, statusField)} />}
                {dateField && <time className="ml-auto text-xs tabular-nums text-muted-foreground">{when(getPath(row, dateField))}</time>}
              </div>
              {descriptionField && <p className="mt-0.5 text-sm text-muted-foreground">{String(getPath(row, descriptionField) ?? '')}</p>}
            </motion.li>
          ))}
        </ol>
      )}
    </Card>
  )
}
