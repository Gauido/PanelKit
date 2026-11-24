import { getPath } from './utils'

/** Fills "{{values.name}}" / "{{row.id}}" placeholders from a scope object. */
export function tpl(text: string, scope: Record<string, unknown>): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const v = getPath(scope, path)
    return v === undefined || v === null ? '' : String(v)
  })
}
