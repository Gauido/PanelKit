import { cn } from '../../lib/utils'

const named: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  red: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  blue: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  violet: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  gray: 'bg-muted text-muted-foreground',
}

// Common status words get a meaningful color; anything else gets a stable one.
const words: [RegExp, string][] = [
  [/^(activ|confirm|pagad|paid|done|hech|complet|ganad|won|ok|libre|disponible|aprobad|approved)/i, 'green'],
  [/^(pend|espera|waiting|nuevo|new|draft|borrador|en curso|progress|reservad)/i, 'amber'],
  [/^(cancel|rechaz|perdid|lost|error|vencid|inactiv|bloque|deud)/i, 'red'],
]
const fallback = ['violet', 'blue', 'green', 'amber', 'red']

export function statusTone(value: string): string {
  for (const [re, tone] of words) if (re.test(value.trim())) return named[tone]!
  let h = 0
  for (const c of value) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return named[fallback[h % fallback.length]!]!
}

export function StatusBadge({ value, className }: { value: unknown; className?: string }) {
  const text = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : String(value ?? '')
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', statusTone(text), className)}>{text}</span>
}
