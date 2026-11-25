import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { cn, getPath, toRows } from '../../lib/utils'
import { StatusBadge } from '../ui/status-badge'

type Row = Record<string, unknown>

export type KanbanProps = {
  title?: string
  data?: unknown
  loading?: boolean
  /** Field that says which column a card is in, e.g. "stage". */
  groupField: string
  /** Column order, comma separated. Empty = the values found in the data. */
  columns?: string
  titleField?: string
  subtitleField?: string
  /** Number shown on the card and summed per column (e.g. amount). */
  amountField?: string
  /** Prefix for the amount, e.g. "$". */
  currency?: string
  /** Dropped on another column: gets the row with its new value already set. */
  onCardMove?: (row: Row) => Promise<unknown> | void
  onCardClick?: (row: Row) => void
}

const fmt = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 })

/** Cards in columns by status. Drag a card to another column to change it. */
export function Kanban({ title, data, loading, groupField, columns, titleField = 'title', subtitleField, amountField, currency = '', onCardMove, onCardClick }: KanbanProps) {
  const source = useMemo(() => toRows(data), [data])
  // Local copy so a moved card stays put while the API answers.
  const [rows, setRows] = useState<Row[]>(source)
  useEffect(() => setRows(source), [source])
  const [over, setOver] = useState<string | null>(null)

  const cols = useMemo(() => {
    const fixed = (columns ?? '').split(',').map((c) => c.trim()).filter(Boolean)
    const found = [...new Set(rows.map((r) => String(getPath(r, groupField) ?? '')).filter(Boolean))]
    return [...fixed, ...found.filter((c) => !fixed.includes(c))]
  }, [columns, rows, groupField])

  const move = async (id: string, to: string) => {
    const i = rows.findIndex((r) => String(r.id ?? rows.indexOf(r)) === id)
    const row = rows[i]
    if (!row || String(getPath(row, groupField)) === to) return
    const next = { ...row, [groupField]: to }
    const before = rows
    setRows(rows.map((r, j) => (j === i ? next : r)))
    try {
      await onCardMove?.(next)
    } catch {
      setRows(before)
    }
  }

  const onDrop = (col: string) => (e: DragEvent) => {
    e.preventDefault()
    setOver(null)
    const id = e.dataTransfer.getData('text/plain')
    if (id) void move(id, col)
  }

  return (
    <div className="grid gap-3">
      {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {loading && !rows.length
          ? [0, 1, 2].map((i) => <div key={i} className="h-64 w-72 shrink-0 animate-pulse rounded-[var(--radius)] bg-muted" />)
          : cols.map((col) => {
              const cards = rows.filter((r) => String(getPath(r, groupField) ?? '') === col)
              const total = amountField ? cards.reduce((s, r) => s + (Number(getPath(r, amountField)) || 0), 0) : 0
              return (
                <section
                  key={col}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOver(col)
                  }}
                  onDragLeave={() => setOver((o) => (o === col ? null : o))}
                  onDrop={onDrop(col)}
                  className={cn('flex w-72 shrink-0 flex-col gap-2 rounded-[var(--radius)] bg-muted/60 p-2 transition-colors', over === col && 'bg-primary/10 ring-2 ring-primary/40')}
                  aria-label={col}
                >
                  <header className="flex items-center justify-between px-1.5 pt-1">
                    <span className="flex items-center gap-2">
                      <StatusBadge value={col} />
                      <span className="text-xs text-muted-foreground">{cards.length}</span>
                    </span>
                    {amountField && <span className="text-xs font-medium text-muted-foreground">{currency}{fmt(total)}</span>}
                  </header>
                  <AnimatePresence initial={false}>
                    {cards.map((r, i) => {
                      const id = String(r.id ?? rows.indexOf(r))
                      return (
                        <motion.article
                          key={id}
                          layout
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.18, delay: Math.min(i, 6) * 0.02 }}
                          className="rounded-[calc(var(--radius)-4px)] border border-border bg-card p-3 shadow-sm"
                        >
                          <div
                            draggable={Boolean(onCardMove)}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', id)
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            onClick={onCardClick ? () => onCardClick(r) : undefined}
                            className={cn(onCardMove && 'cursor-grab active:cursor-grabbing', onCardClick && 'cursor-pointer')}
                          >
                            <p className="text-sm font-medium leading-snug">{String(getPath(r, titleField) ?? '')}</p>
                            {subtitleField && <p className="mt-0.5 text-xs text-muted-foreground">{String(getPath(r, subtitleField) ?? '')}</p>}
                            {amountField && <p className="mt-2 text-sm font-semibold tabular-nums">{currency}{fmt(Number(getPath(r, amountField)) || 0)}</p>}
                          </div>
                        </motion.article>
                      )
                    })}
                  </AnimatePresence>
                  {cards.length === 0 && <p className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Soltá tarjetas acá</p>}
                </section>
              )
            })}
      </div>
    </div>
  )
}
