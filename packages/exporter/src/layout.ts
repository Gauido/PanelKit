import type { Style } from '@panelkit/schema'

/**
 * Responsive widths use container queries, so a block adapts to the space it gets
 * (page, section or modal) and the editor can preview phone / tablet sizes exactly.
 * Phone: under 768px of container · Tablet: @3xl (768px) · Desktop: @5xl (1024px).
 * Class strings are written out literally so Tailwind finds them.
 */
const MOBILE: Record<number, string> = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
}
const TABLET: Record<number, string> = {
  1: '@3xl:col-span-1',
  2: '@3xl:col-span-2',
  3: '@3xl:col-span-3',
  4: '@3xl:col-span-4',
  5: '@3xl:col-span-5',
  6: '@3xl:col-span-6',
  7: '@3xl:col-span-7',
  8: '@3xl:col-span-8',
  9: '@3xl:col-span-9',
  10: '@3xl:col-span-10',
  11: '@3xl:col-span-11',
  12: '@3xl:col-span-12',
}
const DESKTOP: Record<number, string> = {
  1: '@5xl:col-span-1',
  2: '@5xl:col-span-2',
  3: '@5xl:col-span-3',
  4: '@5xl:col-span-4',
  5: '@5xl:col-span-5',
  6: '@5xl:col-span-6',
  7: '@5xl:col-span-7',
  8: '@5xl:col-span-8',
  9: '@5xl:col-span-9',
  10: '@5xl:col-span-10',
  11: '@5xl:col-span-11',
  12: '@5xl:col-span-12',
}

export type Device = 'desktop' | 'tablet' | 'mobile'

export type LayoutLike = { span: number; spanTablet?: number; spanMobile?: number; hide?: Device[] }

const clamp = (n: number) => Math.min(12, Math.max(1, Math.round(n)))

/** Width of a block on each device; tablet and phone follow sensible defaults unless set. */
export function spansFor(layout: LayoutLike): Record<Device, number> {
  const desktop = clamp(layout.span)
  return {
    desktop,
    tablet: clamp(layout.spanTablet ?? (desktop <= 4 ? 6 : 12)),
    mobile: clamp(layout.spanMobile ?? 12),
  }
}

export function layoutClass(layout: LayoutLike): string {
  const s = spansFor(layout)
  const hide = new Set(layout.hide ?? [])
  const show = { mobile: !hide.has('mobile'), tablet: !hide.has('tablet'), desktop: !hide.has('desktop') }
  return [
    MOBILE[s.mobile],
    s.tablet !== s.mobile && TABLET[s.tablet],
    s.desktop !== s.tablet && DESKTOP[s.desktop],
    !show.mobile && 'hidden',
    show.tablet !== show.mobile && (show.tablet ? '@3xl:block' : '@3xl:hidden'),
    show.desktop !== show.tablet && (show.desktop ? '@5xl:block' : '@5xl:hidden'),
  ]
    .filter(Boolean)
    .join(' ')
}

/** Only the desktop width known: tablet and phone get the defaults. */
export function spanClass(span: number): string {
  return layoutClass({ span })
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
