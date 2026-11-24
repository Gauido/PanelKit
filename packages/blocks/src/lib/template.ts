import { getPath } from './utils'

const ONE = /^\{\{\s*([\w.]+)\s*\}\}$/
const ANY = /\{\{\s*([\w.]+)\s*\}\}/g

/** Fills "{{values.name}}" / "{{row.id}}" / "{{state.x}}" placeholders from a scope object. */
export function tpl(text: string, scope: Record<string, unknown>): string {
  return text.replace(ANY, (_, path: string) => {
    const v = getPath(scope, path)
    if (v === undefined || v === null) return ''
    return typeof v === 'object' ? JSON.stringify(v) : String(v)
  })
}

/**
 * Like `tpl`, but "{{row}}" or "{{state.selected}}" alone returns the value itself
 * (object, number, list), so whole records can be passed around.
 */
export function resolve(value: unknown, scope: Record<string, unknown>): unknown {
  if (typeof value === 'string') {
    const one = ONE.exec(value)
    if (one) return getPath(scope, one[1]!)
    return value.includes('{{') ? tpl(value, scope) : value
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, scope))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, scope)]))
  return value
}

/** True when a value (or anything inside it) has a {{...}} placeholder. */
export function hasTemplate(value: unknown): boolean {
  if (typeof value === 'string') return value.includes('{{')
  if (Array.isArray(value)) return value.some(hasTemplate)
  if (value && typeof value === 'object') return Object.values(value).some(hasTemplate)
  return false
}

/** `resolve` typed for JSX props: binds a prop to page state, e.g. bind('{{state.selected}}', { state }). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bind(value: unknown, scope: Record<string, unknown>): any {
  return resolve(value, scope)
}
