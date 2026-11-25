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
  /** Columns out of 12 on desktop. */
  span: z.number().int().min(1).max(12).default(12),
  /** Columns on tablet and phone; unset = sensible defaults. */
  spanTablet: z.number().int().min(1).max(12).optional(),
  spanMobile: z.number().int().min(1).max(12).optional(),
  /** Devices where the block is hidden. */
  hide: z.array(z.enum(['desktop', 'tablet', 'mobile'])).optional(),
})

/** What happens when an event fires. Strings accept {{values.x}} / {{row.x}} templates. */
export const Action = z.discriminatedUnion('type', [
  z.object({ type: z.literal('callQuery'), query: z.string(), body: z.enum(['values', 'row', 'slot', 'day', 'none']).default('values') }),
  /** Asks the user; when they cancel, the remaining actions do not run. */
  z.object({ type: z.literal('confirm'), message: z.string() }),
  /** Saves a page variable. "{{row}}" stores the whole row; "Hola {{row.name}}" stores text. */
  z.object({ type: z.literal('setState'), key: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/), value: z.string() }),
  /** Opens or closes a Modal / Drawer block of this page. */
  z.object({ type: z.literal('openModal'), target: z.string() }),
  z.object({ type: z.literal('closeModal'), target: z.string() }),
  /** Escape hatch: your own JavaScript, with the event data, state, APIs and helpers in scope. */
  z.object({ type: z.literal('runCode'), code: z.string() }),
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
  textColor: z.enum(['default', 'muted', 'primary', 'success', 'warning', 'danger']).optional(),
  fontSize: z.enum(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']).optional(),
  fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']).optional(),
  border: z.enum(['none', 'default', 'primary', 'dashed']).optional(),
  /** Escape hatch for people who know Tailwind. */
  className: z.string().optional(),
  /** Any CSS property, for whatever the options above don't cover: { "min-height": "300px" }. */
  css: z.record(z.string(), z.string()).optional(),
})
export type Style = z.infer<typeof Style>

export type Node = {
  id: string
  type: string
  layout: { span: number; spanTablet?: number; spanMobile?: number; hide?: ('desktop' | 'tablet' | 'mobile')[] }
  props: Record<string, unknown>
  style: Style
  events: Record<string, Action[]>
  /** Name shown in the layers panel. */
  name?: string
  /** JavaScript condition; the block only shows when it's true. E.g. state.turno?.status === 'Pagada' */
  visibleIf?: string
  /** Blocks inside a container (Section, Tabs, Modal, Drawer). */
  children?: Node[]
}

export const Node: z.ZodType<Node, any> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    layout: Layout.default({ span: 12 }),
    props: z.record(z.string(), z.unknown()).default({}),
    style: Style.default({}),
    events: z.record(z.string(), z.array(Action)).default({}),
    name: z.string().optional(),
    visibleIf: z.string().optional(),
    children: z.array(Node).optional(),
  }),
)

/** Every node in a tree, depth first. */
export function* walkNodes(nodes: Node[]): Generator<Node> {
  for (const n of nodes) {
    yield n
    if (n.children) yield* walkNodes(n.children)
  }
}

/** The page variable that tells whether a Modal / Drawer is open. */
export const openKey = (nodeId: string) => `open_${nodeId.replace(/[^A-Za-z0-9_]/g, '_')}`

export const Page = z.object({
  id: z.string(),
  path: z.string().startsWith('/'),
  title: z.string(),
  icon: z.string().default('LayoutDashboard'),
  /** Initial values of the page variables ({{state.x}}). */
  state: z.record(z.string(), z.unknown()).default({}),
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
