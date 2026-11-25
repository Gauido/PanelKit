import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Skeleton } from '../ui/skeleton'
import { StatusBadge } from '../ui/status-badge'
import { cn, getPath, toRows } from '../../lib/utils'

export type Column = {
  field: string
  label: string
  format?: 'text' | 'number' | 'money' | 'badge' | 'email' | 'date' | 'datetime' | 'boolean' | 'image' | 'link'
}

export type DataTableProps = {
  title?: string
  data?: unknown
  columns: Column[]
  pageSize?: number
  searchable?: boolean
  loading?: boolean
  error?: string
  /** Adds a select above the table to filter by this field's values. */
  filterField?: string
  onRowClick?: (row: Record<string, unknown>) => void
  /** When set, each row shows an edit button. */
  onRowEdit?: (row: Record<string, unknown>) => void
  /** When set, each row shows a delete button. */
  onRowDelete?: (row: Record<string, unknown>) => void
}

function Cell({ value, format = 'text' }: { value: unknown; format?: Column['format'] }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">—</span>
  const text = String(value)
  switch (format) {
    case 'badge':
      return <StatusBadge value={value} />
    case 'image':
      return <img src={text} alt="" loading="lazy" className="size-9 rounded-md object-cover" />
    case 'link':
      return (
        <a className="text-primary hover:underline" href={text} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {text.startsWith('data:') ? 'Descargar' : 'Abrir'}
        </a>
      )
    case 'boolean':
      return <StatusBadge value={value === true || text === 'true' || text === '1'} />
    case 'money':
      return <span className="tabular-nums">{Number(value).toLocaleString(undefined, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })}</span>
    case 'datetime':
      return <span className="tabular-nums">{new Date(text).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
    case 'email':
      return <a className="text-primary hover:underline" href={`mailto:${text}`}>{text}</a>
    case 'number':
      return <span className="tabular-nums">{Number(value).toLocaleString()}</span>
    case 'date':
      return <span className="tabular-nums">{new Date(text).toLocaleDateString()}</span>
    default:
      return <span>{text}</span>
  }
}

export function DataTable({ title, data, columns, pageSize = 8, searchable = true, loading, error, filterField, onRowClick, onRowEdit, onRowDelete }: DataTableProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const hasActions = Boolean(onRowEdit || onRowDelete)
  const filterValues = useMemo(() => (filterField ? [...new Set(toRows(data).map((r) => String(getPath(r, filterField) ?? '')).filter(Boolean))].sort() : []), [data, filterField])
  const [sort, setSort] = useState<{ field: string; dir: 1 | -1 } | null>(null)
  const [page, setPage] = useState(0)

  const rows = useMemo(() => {
    let out = toRows(data)
    if (filterField && filter) out = out.filter((r) => String(getPath(r, filterField) ?? '') === filter)
    if (query) {
      const q = query.toLowerCase()
      out = out.filter((r) => columns.some((c) => String(getPath(r, c.field) ?? '').toLowerCase().includes(q)))
    }
    if (sort) {
      out = [...out].sort((a, b) => {
        const x = getPath(a, sort.field)
        const y = getPath(b, sort.field)
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir
        return String(x ?? '').localeCompare(String(y ?? '')) * sort.dir
      })
    }
    return out
  }, [data, query, sort, columns, filterField, filter])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages - 1)
  const visible = rows.slice(current * pageSize, current * pageSize + pageSize)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
        <div className="flex flex-wrap items-center gap-2">
        {filterField && filterValues.length > 0 && (
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filtro">
            {['', ...filterValues].slice(0, 7).map((v) => (
              <button
                key={v || 'all'}
                onClick={() => { setFilter(v); setPage(0) }}
                className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors', filter === v ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
              >
                {v || 'Todos'}
              </button>
            ))}
          </div>
        )}
        {searchable && (
          <div className="relative w-full max-w-60">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} />
          </div>
        )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th key={c.field} className="px-5 py-2.5 font-medium">
                  <button
                    className="inline-flex items-center gap-1 hover:text-foreground"
                    onClick={() => setSort((s) => (s?.field === c.field ? { field: c.field, dir: s.dir === 1 ? -1 : 1 } : { field: c.field, dir: 1 }))}
                  >
                    {c.label}
                    <ArrowUpDown className={cn('size-3', sort?.field === c.field ? 'opacity-100' : 'opacity-40')} />
                  </button>
                </th>
              ))}
              {hasActions && <th className="w-px px-5 py-2.5"><span className="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} className="border-b border-border/60">
                  {columns.map((c) => (
                    <td key={c.field} className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))}
            <AnimatePresence initial={false} mode="popLayout">
              {!loading &&
                visible.map((row, i) => (
                  <motion.tr
                    key={String(getPath(row, 'id') ?? `${current}-${i}`)}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }}
                    exit={{ opacity: 0 }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('border-b border-border/60 transition-colors hover:bg-muted/40', onRowClick && 'cursor-pointer')}
                  >
                    {columns.map((c) => (
                      <td key={c.field} className="whitespace-nowrap px-5 py-3"><Cell value={getPath(row, c.field)} format={c.format} /></td>
                    ))}
                    {hasActions && (
                      <td className="whitespace-nowrap px-3 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {onRowEdit && (
                          <Button variant="ghost" className="size-8 px-0" onClick={() => onRowEdit(row)} aria-label="Editar"><Pencil className="size-3.5" /></Button>
                        )}
                        {onRowDelete && (
                          <Button variant="ghost" className="size-8 px-0 text-rose-600 hover:bg-rose-500/10" onClick={() => onRowDelete(row)} aria-label="Eliminar"><Trash2 className="size-3.5" /></Button>
                        )}
                      </td>
                    )}
                  </motion.tr>
                ))}
            </AnimatePresence>
          </tbody>
        </table>
        {!loading && !error && rows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Sin resultados</p>}
        {error && <p className="p-8 text-center text-sm text-rose-600">{error}</p>}
      </div>
      <div className="flex items-center justify-between gap-3 px-5 py-3 text-xs text-muted-foreground">
        <span>{rows.length.toLocaleString()} registros</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="size-8 px-0" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Página anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="tabular-nums">{current + 1} / {pages}</span>
          <Button variant="ghost" className="size-8 px-0" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Página siguiente">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
