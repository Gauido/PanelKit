import type { ComponentProps } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'ghost' | 'outline'

export function Button({ className, variant = 'primary', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-[calc(var(--radius)-4px)] px-4 text-sm font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant === 'primary' && 'bg-primary text-primary-foreground shadow-sm hover:brightness-110',
        variant === 'ghost' && 'hover:bg-muted',
        variant === 'outline' && 'border border-border bg-transparent hover:bg-muted',
        className,
      )}
      {...props}
    />
  )
}
