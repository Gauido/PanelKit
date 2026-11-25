import { Fragment, type ReactNode } from 'react'
import { toRows } from '../../lib/utils'

export type RepeaterProps = {
  /** Rows from the API (an array, or an object with the array inside). */
  data?: unknown
  loading?: boolean
  emptyText?: string
  /** Shown once per row. Blocks inside read the row as {{item.x}} and its position as {{index}}. */
  children: (item: Record<string, unknown>, index: number) => ReactNode
}

/** Repeats the blocks inside once per record: cards, galleries, lists, anything. */
export function Repeater({ data, loading, emptyText = 'No hay nada para mostrar.', children }: RepeaterProps) {
  const rows = toRows(data)
  if (loading && !rows.length) {
    return (
      <div className="grid grid-cols-12 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="col-span-12 h-24 animate-pulse rounded-[var(--radius)] bg-muted @3xl:col-span-4" />
        ))}
      </div>
    )
  }
  if (!rows.length) return <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{emptyText}</p>
  return (
    <div className="@container grid grid-cols-12 gap-4">
      {rows.map((item, i) => (
        <Fragment key={String(item.id ?? i)}>{children(item, i)}</Fragment>
      ))}
    </div>
  )
}
