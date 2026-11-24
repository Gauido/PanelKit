import type { ReactNode } from 'react'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

export type SectionProps = {
  title?: string
  description?: string
  /** Draw it as a card. Off: just a group of blocks. */
  card?: boolean
  children?: ReactNode
}

/** Groups any blocks on its own 12-column grid. */
export function Section({ title, description, card = true, children }: SectionProps) {
  const body = (
    <>
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="@container grid grid-cols-12 gap-4">{children}</div>
    </>
  )
  return card ? <Card className="p-5">{body}</Card> : <div className={cn(!title && !description && 'contents')}>{body}</div>
}
