import { cn } from '../../lib/utils'

export type TextProps = {
  text?: string
  /** Look of the text. Color, size and weight can still be changed from the block's style. */
  variant?: 'title' | 'subtitle' | 'paragraph' | 'small' | 'label'
  /** Makes it a link. */
  href?: string
  newTab?: boolean
}

const VARIANT = {
  title: 'text-2xl font-semibold tracking-tight',
  subtitle: 'text-lg font-medium',
  paragraph: 'text-sm leading-relaxed',
  small: 'text-xs text-muted-foreground',
  label: 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
} as const
const TAG = { title: 'h2', subtitle: 'h3', paragraph: 'p', small: 'p', label: 'p' } as const

/** Free text: titles, paragraphs, labels or links. Keeps line breaks. */
export function Text({ text = '', variant = 'paragraph', href, newTab }: TextProps) {
  const cls = cn('whitespace-pre-line', VARIANT[variant])
  if (href) {
    return (
      <a href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noreferrer' : undefined} className={cn(cls, 'text-primary underline-offset-4 hover:underline')}>
        {text}
      </a>
    )
  }
  const Tag = TAG[variant]
  return <Tag className={cls}>{text}</Tag>
}
