/**
 * "Show only if" conditions built from lists, for people who don't write code.
 * They are saved as a small JavaScript expression (what the export runs) and read back here.
 */
export type Op = 'eq' | 'ne' | 'contains' | 'empty' | 'filled' | 'gt' | 'lt'
export type Condition = { left: string; op: Op; value: string }

export const ops: { value: Op; label: string; needsValue: boolean }[] = [
  { value: 'eq', label: 'es igual a', needsValue: true },
  { value: 'ne', label: 'no es igual a', needsValue: true },
  { value: 'contains', label: 'contiene', needsValue: true },
  { value: 'filled', label: 'tiene algo', needsValue: false },
  { value: 'empty', label: 'está vacío', needsValue: false },
  { value: 'gt', label: 'es mayor que', needsValue: true },
  { value: 'lt', label: 'es menor que', needsValue: true },
]

/** state.turno.status -> state.turno?.status, so a missing value doesn't throw. */
const safe = (path: string) => path.split('.').map((p, i) => (i < 2 ? p : `?.${p}`)).join('.').replace(/\.\?\./g, '?.')
const plain = (path: string) => path.replace(/\?\./g, '.')

function literal(v: string): string {
  const t = v.trim()
  if (t === 'true' || t === 'false') return t
  if (t !== '' && !Number.isNaN(Number(t))) return t
  return JSON.stringify(v)
}

export function toExpr(c: Condition): string {
  const l = safe(c.left)
  switch (c.op) {
    case 'eq': return `${l} === ${literal(c.value)}`
    case 'ne': return `${l} !== ${literal(c.value)}`
    case 'contains': return `String(${l} ?? '').toLowerCase().includes(${JSON.stringify(c.value)}.toLowerCase())`
    case 'empty': return `!${l}`
    case 'filled': return `Boolean(${l})`
    case 'gt': return `Number(${l}) > ${Number(c.value) || 0}`
    case 'lt': return `Number(${l}) < ${Number(c.value) || 0}`
  }
}

const PATH = '((?:state|item)(?:\\??\\.[\\w$]+)*)'
const unquote = (v: string) => {
  const single = v.match(/^'(.*)'$/)
  if (single) return single[1]!.replace(/\\'/g, "'")
  try {
    const x = JSON.parse(v)
    return String(x)
  } catch {
    return v
  }
}

/** Reads back a condition made by `toExpr`; anything else is "advanced" (written by hand). */
export function fromExpr(expr: string | undefined): Condition | null {
  const e = expr?.trim()
  if (!e) return null
  let m: RegExpMatchArray | null
  if ((m = e.match(new RegExp(`^${PATH} (===|!==) (.+)$`)))) return { left: plain(m[1]!), op: m[2] === '===' ? 'eq' : 'ne', value: unquote(m[3]!) }
  if ((m = e.match(new RegExp(`^String\\(${PATH} \\?\\? ''\\)\\.toLowerCase\\(\\)\\.includes\\((".*")\\.toLowerCase\\(\\)\\)$`)))) return { left: plain(m[1]!), op: 'contains', value: unquote(m[2]!) }
  if ((m = e.match(new RegExp(`^!${PATH}$`)))) return { left: plain(m[1]!), op: 'empty', value: '' }
  if ((m = e.match(new RegExp(`^Boolean\\(${PATH}\\)$`)))) return { left: plain(m[1]!), op: 'filled', value: '' }
  if ((m = e.match(new RegExp(`^Number\\(${PATH}\\) (>|<) (-?[\\d.]+)$`)))) return { left: plain(m[1]!), op: m[2] === '>' ? 'gt' : 'lt', value: m[3]! }
  return null
}
