import { useMemo } from 'react'
import { getPath } from '../../lib/utils'

export type HtmlBlockProps = {
  /** Raw HTML. Tailwind classes and any installed CSS framework classes work here. */
  html: string
  /** Values for {{state.x}} placeholders. They are HTML-escaped, so data can't inject markup. */
  scope?: Record<string, unknown>
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Free-form HTML for full control over a piece of the page. Only render HTML you wrote yourself. */
export function HtmlBlock({ html, scope }: HtmlBlockProps) {
  const out = useMemo(
    () =>
      scope
        ? html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
            const v = getPath(scope, path)
            return v === undefined || v === null ? '' : escape(typeof v === 'object' ? JSON.stringify(v) : String(v))
          })
        : html,
    [html, scope],
  )
  return <div className="pk-html" dangerouslySetInnerHTML={{ __html: out }} />
}
