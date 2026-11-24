import { AnimatePresence, motion } from 'motion/react'
import { Children, useId, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type TabsProps = {
  /** One label per child block, in order. */
  labels: string[]
  variant?: 'underline' | 'pills'
  children?: ReactNode
}

/** Shows one child block at a time. Put a Section in a tab to show several blocks. */
export function Tabs({ labels, variant = 'underline', children }: TabsProps) {
  const items = Children.toArray(children)
  const [active, setActive] = useState(0)
  const id = useId()
  const current = Math.min(active, Math.max(items.length - 1, 0))
  return (
    <div>
      <div role="tablist" className={cn('flex flex-wrap gap-1', variant === 'underline' ? 'border-b border-border' : 'w-fit rounded-[var(--radius)] bg-muted p-1')}>
        {items.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            onClick={() => setActive(i)}
            className={cn('relative px-3.5 py-2 text-sm font-medium transition-colors', i === current ? 'text-foreground' : 'text-muted-foreground hover:text-foreground', variant === 'pills' && 'rounded-[calc(var(--radius)-4px)] py-1.5')}
          >
            {i === current && (
              <motion.span
                layoutId={`tab-${id}`}
                className={cn('absolute', variant === 'underline' ? 'inset-x-2 -bottom-px h-0.5 rounded-full bg-primary' : 'inset-0 rounded-[inherit] bg-card shadow-sm')}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{labels[i] || `Pestaña ${i + 1}`}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={current} className="pt-4" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
          {items[current]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
