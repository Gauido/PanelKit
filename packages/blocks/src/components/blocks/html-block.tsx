export type HtmlBlockProps = {
  /** Raw HTML. Tailwind classes and any installed CSS framework classes work here. */
  html: string
}

/** Free-form HTML for full control over a piece of the page. Only render HTML you wrote yourself. */
export function HtmlBlock({ html }: HtmlBlockProps) {
  return <div className="pk-html" dangerouslySetInnerHTML={{ __html: html }} />
}
