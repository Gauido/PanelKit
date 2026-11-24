/** Tiny helpers that print readable TypeScript/JSX. */

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export function toJs(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  const inner = '  '.repeat(indent + 1)
  if (value === null || value === undefined) return 'undefined'
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const simple = value.every((v) => typeof v !== 'object' || v === null)
    if (simple) return `[${value.map((v) => toJs(v)).join(', ')}]`
    return `[\n${value.map((v) => `${inner}${toJs(v, indent + 1)},`).join('\n')}\n${pad}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== '')
    if (entries.length === 0) return '{}'
    const parts = entries.map(([k, v]) => `${IDENT.test(k) ? k : toJs(k)}: ${toJs(v, indent + 1)}`)
    const oneLine = `{ ${parts.join(', ')} }`
    if (oneLine.length <= 90 && !oneLine.includes('\n')) return oneLine
    return `{\n${parts.map((p) => `${inner}${p},`).join('\n')}\n${pad}}`
  }
  return 'undefined'
}

export function jsxAttr(key: string, value: unknown, indent: number): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'string' && !/["\n{}<>]/.test(value)) return `${key}="${value}"`
  return `${key}={${toJs(value, indent)}}`
}

export function camel(input: string): string {
  const words = input.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  const norm = words.map((w) => (w.length > 1 && w === w.toUpperCase() ? w.toLowerCase() : w))
  const out = norm.map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1))).join('')
  return /^[A-Za-z_]/.test(out) ? out : `x${out}`
}

export function pascal(input: string): string {
  const c = camel(input)
  return c.charAt(0).toUpperCase() + c.slice(1)
}

export function kebab(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'page'
}

/** True when a value (or anything inside it) has a {{...}} placeholder. */
export function hasTemplate(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('{{')
  if (Array.isArray(value)) return value.some(hasTemplate)
  if (value && typeof value === 'object') return Object.values(value).some(hasTemplate)
  return false
}
