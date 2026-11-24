import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const inputClass =
  'h-9 w-full min-w-0 rounded-[calc(var(--radius)-4px)] border border-border bg-background px-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />
}
