import type { Dependency } from '@panelkit/schema'

export type CatalogPackage = Dependency & { label: string; description: string; note?: string }

/** Curated style frameworks and helpers, installable in one click. */
export const packageCatalog: CatalogPackage[] = [
  { label: 'Bootstrap 5', name: 'bootstrap', version: '^5.3.9', kind: 'css', css: 'dist/css/bootstrap.min.css', description: 'Clases clásicas: btn, card, row, col', note: 'Trae su propio reset: puede cambiar el aspecto de los bloques.' },
  { label: 'Bulma', name: 'bulma', version: '^1.0.4', kind: 'css', css: 'css/bulma.min.css', description: 'Framework CSS moderno sin JavaScript', note: 'Trae su propio reset: puede cambiar el aspecto de los bloques.' },
  { label: 'Pico CSS', name: '@picocss/pico', version: '^2.1.1', kind: 'css', css: 'css/pico.classless.min.css', description: 'Estilos lindos para HTML sin clases' },
  { label: 'Animate.css', name: 'animate.css', version: '^4.1.1', kind: 'css', css: 'animate.min.css', description: 'Animaciones listas: animate__bounce, animate__fadeIn…' },
  { label: 'daisyUI', name: 'daisyui', version: '^5.8.2', kind: 'tailwind-plugin', description: 'Componentes para Tailwind: btn, card, badge, modal', note: 'Plugin de Tailwind: se aplica en el repo exportado.' },
  { label: 'Day.js', name: 'dayjs', version: '^1.11.0', kind: 'js', description: 'Fechas fáciles de formatear y calcular' },
]

export function cdnCssUrl(dep: Dependency): string | null {
  if (dep.kind !== 'css' || !dep.css) return null
  const version = dep.version.replace(/^[\^~]/, '') || 'latest'
  return `https://cdn.jsdelivr.net/npm/${dep.name}@${version}/${dep.css.replace(/^\/+/, '')}`
}
