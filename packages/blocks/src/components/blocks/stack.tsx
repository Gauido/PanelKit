import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type StackProps = {
  /** row: side by side. column: one below the other. */
  direction?: 'row' | 'column'
  gap?: 'none' | 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  /** Let items move to a new line when they don't fit. */
  wrap?: boolean
  /** On phones, put row items one below the other. */
  stackOnMobile?: boolean
  children?: ReactNode
}

const GAP = { none: 'gap-0', sm: 'gap-2', md: 'gap-4', lg: 'gap-8' } as const
const ALIGN = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' } as const
const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' } as const

/** Free layout: items in a row or a column, sized by their content. */
export function Stack({ direction = 'row', gap = 'md', align = 'center', justify = 'start', wrap = true, stackOnMobile = false, children }: StackProps) {
  return (
    <div className="@container">
      <div
        className={cn(
          'flex',
          direction === 'row' ? (stackOnMobile ? 'flex-col @xl:flex-row' : 'flex-row') : 'flex-col',
          wrap && direction === 'row' && 'flex-wrap',
          GAP[gap],
          ALIGN[align],
          JUSTIFY[justify],
        )}
      >
        {children}
      </div>
    </div>
  )
}
