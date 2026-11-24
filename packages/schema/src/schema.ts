import { z } from 'zod'

/** Env placeholders like {{env.API_URL}} keep secrets out of the project file. */
export const ENV_REF = /\{\{\s*env\.([A-Z0-9_]+)\s*\}\}/g

export const RestDataSource = z.object({
  id: z.string(),
  type: z.literal('rest'),
  name: z.string(),
  baseUrl: z.string(),
  headers: z.record(z.string(), z.string()).default({}),
})
export type RestDataSource = z.infer<typeof RestDataSource>

/** Sample data that lives inside the project: start without any API. */
export const StaticDataSource = z.object({
  id: z.string(),
  type: z.literal('static'),
  name: z.string(),
  /** Collections served at "/<name>". */
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).default({}),
})
export type StaticDataSource = z.infer<typeof StaticDataSource>

export const DataSource = z.discriminatedUnion('type', [RestDataSource, StaticDataSource])
export type DataSource = z.infer<typeof DataSource>

export const Query = z.object({
  id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'Use letters and digits, starting with a letter'),
  source: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  path: z.string(),
  /** Field names inferred from a test call, offered in the mapping dropdowns. */
  fields: z.array(z.string()).default([]),
})
export type Query = z.infer<typeof Query>

export const Layout = z.object({
  span: z.number().int().min(1).max(12).default(12),
})

/** What happens when an event fires. Strings accept {{values.x}} / {{row.x}} templates. */
export const Action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('callQuery'), query: z.string(), body: z.enum(['values', 'row', 'slot', 'day', 'none']).default('values') }),
  /** Asks the user; when they cancel, the remaining actions do not run. */
  z.object({ type: z.literal('confirm'), message: z.string() }),
  z.object({ type: z.literal('navigate'), to: z.string() }),
  z.object({ type: z.literal('toast'), message: z.string(), tone: z.enum(['success', 'error', 'info']).default('success') }),
  z.object({ type: z.literal('refresh') }),
  z.object({ type: z.literal('openUrl'), url: z.string() }),
])
export type Action = z.infer<typeof Action>

/** Visual overrides, mapped to a fixed set of classes so exports stay clean. */
export const Style = z.object({
  padding: z.enum(['none', 'sm', 'md', 'lg']).optional(),
  background: z.enum(['default', 'muted', 'primary', 'transparent']).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  shadow: z.enum(['none', 'sm', 'lg']).optional(),
  /** Escape hatch for people who know Tailwind. */
  className: z.string().optional(),
})
export type Style = z.infer<typeof Style>

export const Node = z.object({
  id: z.string(),
  type: z.string(),
  layout: Layout.default({ span: 12 }),
  props: z.record(z.string(), z.unknown()).default({}),
  style: Style.default({}),
  events: z.record(z.string(), z.array(Action)).default({}),
})
export type Node = z.infer<typeof Node>

export const Page = z.object({
  id: z.string(),
  path: z.string().startsWith('/'),
  title: z.string(),
  icon: z.string().default('LayoutDashboard'),
  children: z.array(Node).default([]),
})
export type Page = z.infer<typeof Page>

export const FONTS = ['Inter', 'Geist', 'Plus Jakarta Sans', 'DM Sans', 'Manrope', 'Space Grotesk', 'Outfit'] as const

export const Theme = z.object({
  preset: z.string().default('moderno'),
  accent: z.string().default('violet'),
  /** Any CSS color. Overrides `accent` when set. */
  primary: z.string().optional(),
  radius: z.number().min(0).max(28).default(12),
  mode: z.enum(['light', 'dark', 'system']).default('system'),
  font: z.enum(FONTS).default('Inter'),
  surface: z.enum(['cool', 'neutral', 'warm']).default('cool'),
  motion: z.enum(['none', 'subtle', 'normal', 'playful']).default('normal'),
})
export type Theme = z.infer<typeof Theme>

/** An npm package added to the exported repo. */
export const Dependency = z.object({
  name: z.string().min(1),
  version: z.string().default('latest'),
  /** css: import a stylesheet globally · tailwind-plugin: @plugin in CSS · js: just install it. */
  kind: z.enum(['css', 'tailwind-plugin', 'js']).default('js'),
  /** Stylesheet path inside the package, for kind "css". */
  css: z.string().optional(),
})
export type Dependency = z.infer<typeof Dependency>

export const Project = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  theme: Theme.default({ preset: 'moderno', accent: 'violet', radius: 12, mode: 'system', font: 'Inter', surface: 'cool', motion: 'normal' }),
  dataSources: z.array(DataSource).default([]),
  queries: z.array(Query).default([]),
  pages: z.array(Page).min(1),
  dependencies: z.array(Dependency).default([]),
  /** Global CSS appended last, in the editor and in the export. */
  customCss: z.string().default(''),
})
export type Project = z.infer<typeof Project>

export function parseProject(input: unknown): Project {
  return Project.parse(input)
}

/** Every {{env.X}} name used anywhere in the data sources. */
export function envVars(project: Project): string[] {
  const names = new Set<string>()
  for (const ds of project.dataSources) {
    if (ds.type !== 'rest') continue
    const text = [ds.baseUrl, ...Object.values(ds.headers)].join(' ')
    for (const m of text.matchAll(ENV_REF)) names.add(m[1]!)
  }
  return [...names].sort()
}

export function resolveEnv(value: string, env: Record<string, string | undefined>): string {
  return value.replace(ENV_REF, (_, name: string) => env[name] ?? '')
}

/** Flattens a JSON response into the field names a user can map. */
export function inferFields(sample: unknown): string[] {
  const row = Array.isArray(sample) ? sample[0] : sample
  if (!row || typeof row !== 'object') return []
  const out: string[] = []
  const walk = (obj: Record<string, unknown>, prefix: string, depth: number) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k
      if (v && typeof v === 'object' && !Array.isArray(v) && depth < 2) walk(v as Record<string, unknown>, key, depth + 1)
      else out.push(key)
    }
  }
  walk(row as Record<string, unknown>, '', 0)
  return out
}

export function newId(prefix = 'n'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}
