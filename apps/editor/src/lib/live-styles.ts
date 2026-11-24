import { useEffect } from 'react'
import { cdnCssUrl, themeVars } from '@panelkit/exporter'
import type { Project } from '@panelkit/schema'

let tailwindRuntime: Promise<unknown> | null = null

/**
 * Tailwind's browser build compiles classes typed by the user (custom classes, HTML blocks)
 * that the editor's own build never saw. Loaded lazily, only once.
 */
function ensureTailwindRuntime() {
  if (tailwindRuntime) return
  const style = document.createElement('style')
  style.type = 'text/tailwindcss'
  style.textContent = `@theme inline {
  --color-background: var(--background); --color-foreground: var(--foreground);
  --color-card: var(--card); --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted); --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border); --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground); --color-ring: var(--ring);
}
@custom-variant dark (&:where(.dark, .dark *));`
  document.head.appendChild(style)
  tailwindRuntime = import('@tailwindcss/browser')
}

/** Applies the project's theme, CSS packages and custom CSS to the editor document. */
export function useLiveStyles(project: Project | null) {
  const theme = project?.theme
  const deps = project?.dependencies
  const customCss = project?.customCss

  useEffect(() => {
    const root = document.documentElement
    if (!theme) {
      // Home screen: PanelKit's own look, not the last project's.
      root.dataset.accent = 'violet'
      root.dataset.surface = 'cool'
      root.dataset.motion = 'normal'
      for (const k of ['--primary', '--ring', '--radius', '--pk-font']) root.style.removeProperty(k)
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
      return
    }
    root.dataset.accent = theme.accent
    root.dataset.surface = theme.surface
    root.dataset.motion = theme.motion
    root.style.removeProperty('--primary')
    root.style.removeProperty('--ring')
    for (const [k, v] of Object.entries(themeVars(theme))) root.style.setProperty(k, v)
    const dark = theme.mode === 'dark' || (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', dark)
  }, [theme])

  useEffect(() => {
    document.querySelectorAll('link[data-pk-dep]').forEach((el) => el.remove())
    for (const dep of deps ?? []) {
      const href = cdnCssUrl(dep)
      if (!href) continue
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.dataset.pkDep = dep.name
      // Before our own styles, as in the exported index.css.
      document.head.prepend(link)
    }
  }, [deps])

  useEffect(() => {
    let el = document.getElementById('pk-custom-css') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'pk-custom-css'
      document.head.appendChild(el)
    }
    el.textContent = customCss ?? ''
  }, [customCss])

  useEffect(() => {
    if (project) ensureTailwindRuntime()
  }, [project])
}
