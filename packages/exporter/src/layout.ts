import type { Style } from '@panelkit/schema'

/** Literal class strings so Tailwind can see them in both the editor and the export. */
export const SPAN_CLASSES: Record<number, string> = {
  1: 'col-span-12 sm:col-span-6 lg:col-span-1',
  2: 'col-span-12 sm:col-span-6 lg:col-span-2',
  3: 'col-span-12 sm:col-span-6 xl:col-span-3',
  4: 'col-span-12 sm:col-span-6 xl:col-span-4',
  5: 'col-span-12 lg:col-span-5',
  6: 'col-span-12 lg:col-span-6',
  7: 'col-span-12 lg:col-span-7',
  8: 'col-span-12 lg:col-span-8',
  9: 'col-span-12 lg:col-span-9',
  10: 'col-span-12 lg:col-span-10',
  11: 'col-span-12 lg:col-span-11',
  12: 'col-span-12',
}

export function spanClass(span: number): string {
  return SPAN_CLASSES[Math.min(12, Math.max(1, Math.round(span)))] ?? 'col-span-12'
}

const PADDING = { none: '', sm: 'p-2', md: 'p-4', lg: 'p-8' } as const
const BACKGROUND = { default: '', muted: 'rounded-[var(--radius)] bg-muted', primary: 'rounded-[var(--radius)] bg-primary text-primary-foreground', transparent: 'bg-transparent' } as const
const ALIGN = { left: 'text-left', center: 'text-center flex justify-center', right: 'text-right flex justify-end' } as const
const SHADOW = { none: '', sm: 'shadow-sm', lg: 'shadow-xl' } as const

export function styleClass(style: Style | undefined): string {
  if (!style) return ''
  return [
    style.padding && PADDING[style.padding],
    style.background && BACKGROUND[style.background],
    style.align && ALIGN[style.align],
    style.shadow && SHADOW[style.shadow],
    style.className,
  ]
    .filter(Boolean)
    .join(' ')
}
