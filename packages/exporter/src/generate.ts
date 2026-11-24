import { envVars, openKey, walkNodes, type Action, type Node, type Page, type Project } from '@panelkit/schema'
import { blockFor } from './registry'
import { layoutClass, styleClass } from './layout'
import { camel, hasTemplate, jsxAttr, kebab, pascal, toJs } from './codegen'
import { devDeps, runtimeDeps } from './versions'
import { fonts, themeVars } from './themes'

/**
 * Runtime files from @panelkit/blocks/src, keyed by their path under src/
 * (e.g. "components/blocks/kpi-card.tsx"). They are copied verbatim.
 */
export type RuntimeFiles = Record<string, string>

export type GeneratedFiles = Record<string, string>

const ENV_PREFIX = 'VITE_'

function sourceVar(project: Project, id: string) {
  const ds = project.dataSources.find((d) => d.id === id)
  return camel(ds?.name ?? id) || 'api'
}

function printEnvString(value: string): string {
  if (!/\{\{\s*env\./.test(value)) return toJs(value)
  const body = value.replace(/`/g, '\\`').replace(/\{\{\s*env\.([A-Z0-9_]+)\s*\}\}/g, (_, n: string) => `\${import.meta.env.${ENV_PREFIX}${n} ?? ''}`)
  return `\`${body}\``
}

function sampleDataFile(project: Project): string | null {
  const sources = project.dataSources.filter((d) => d.type === 'static')
  if (!sources.length) return null
  const body = sources.map((d) => `  ${sourceVar(project, d.id)}: ${JSON.stringify(d.type === 'static' ? d.tables : {}, null, 2).replace(/\n/g, '\n  ')},`).join('\n')
  return `/** Sample data designed in PanelKit. Replace it with a real API when you are ready. */\nexport const sampleData = {\n${body}\n}\n`
}

function apiClient(project: Project): string {
  const hasStatic = project.dataSources.some((d) => d.type === 'static')
  const hasRest = project.dataSources.some((d) => d.type === 'rest')
  const names = [hasRest && 'createApi', hasStatic && 'createMockApi'].filter(Boolean).join(', ')
  const lines = names ? [`import { ${names} } from '@/lib/api'`] : []
  if (hasStatic) lines.push("import { sampleData } from './sample-data'")
  lines.push('')
  for (const ds of project.dataSources) {
    if (ds.type === 'static') {
      const v = sourceVar(project, ds.id)
      lines.push(`/** ${ds.name}: sample data kept in memory */`, `export const ${v} = createMockApi(sampleData.${v}, ${toJs(v)})`, '')
      continue
    }
    const headers = Object.entries(ds.headers)
    const h = headers.length ? `, {\n${headers.map(([k, v]) => `  ${toJs(k)}: ${printEnvString(v)},`).join('\n')}\n}` : ''
    lines.push(`/** ${ds.name} */`)
    lines.push(`export const ${sourceVar(project, ds.id)} = createApi(${printEnvString(ds.baseUrl)}${h})`, '')
  }
  if (project.dataSources.length === 0) lines.push('export {}')
  return lines.join('\n')
}

type PageCtx = {
  imports: Map<string, Set<string>>
  hooks: string[]
  needsNavigate: boolean
  needsQueryClient: boolean
  queryVars: Map<string, string>
  /** The page keeps variables (`usePageState`): set by actions, read as {{state.x}}. */
  usesState: boolean
}

function addImport(ctx: PageCtx, from: string, name: string) {
  if (!ctx.imports.has(from)) ctx.imports.set(from, new Set())
  ctx.imports.get(from)!.add(name)
}

const STATE_ACTIONS = new Set(['setState', 'openModal', 'closeModal', 'runCode'])

function pageUsesState(project: Project, page: Page): boolean {
  if (Object.keys(page.state ?? {}).length) return true
  for (const n of walkNodes(page.children)) {
    if (blockFor(n)?.container === 'overlay' || n.type === 'Filter') return true
    if (JSON.stringify(n.props).includes('{{state.')) return true
    for (const key of blockFor(n)?.readQueries ?? []) {
      const q = project.queries.find((x) => x.id === n.props[key])
      if (q?.path.includes('{{state.')) return true
    }
    for (const list of Object.values(n.events)) {
      for (const a of list) if (STATE_ACTIONS.has(a.type) || JSON.stringify(a).includes('{{state.')) return true
    }
  }
  return false
}

const indent = (lines: string[], by = 1) => lines.map((l) => (l ? '  '.repeat(by) + l : l))

function scopeOf(arg: string | undefined, ctx: PageCtx): string {
  const parts = [arg, ctx.usesState ? 'state: page.get()' : undefined].filter(Boolean)
  return parts.length ? `{ ${parts.join(', ')} }` : '{}'
}

function actionLines(project: Project, actions: Action[], arg: string | undefined, ctx: PageCtx): string[] {
  const scope = scopeOf(arg, ctx)
  const str = (s: string) => (/\{\{/.test(s) ? `tpl(${toJs(s)}, ${scope})` : toJs(s))
  const out: string[] = []
  for (const a of actions) {
    switch (a.type) {
      case 'callQuery': {
        const q = project.queries.find((x) => x.id === a.query)
        if (!q) break
        const api = sourceVar(project, q.source)
        addImport(ctx, '@/api/client', api)
        const body = a.body === 'none' || !arg ? '' : `, ${a.body === arg ? arg : 'undefined'}`
        out.push(`await ${api}.request(${toJs(q.method)}, ${str(q.path)}${body})`)
        break
      }
      case 'confirm':
        addImport(ctx, '@/components/ui/confirm', 'confirm')
        out.push(`if (!(await confirm(${str(a.message)}))) return`)
        break
      case 'setState': {
        const value = /\{\{/.test(a.value) ? `bind(${toJs(a.value)}, ${scope})` : toJs(a.value)
        if (value.startsWith('bind(')) addImport(ctx, '@/lib/template', 'bind')
        out.push(`page.set(${toJs(a.key)}, ${value})`)
        break
      }
      case 'openModal':
      case 'closeModal':
        out.push(`page.set(${toJs(openKey(a.target))}, ${a.type === 'openModal'})`)
        break
      case 'runCode': {
        ctx.needsNavigate = true
        ctx.needsQueryClient = true
        addImport(ctx, '@/components/ui/toaster', 'toast')
        const apis = project.dataSources.map((d) => sourceVar(project, d.id))
        for (const v of apis) addImport(ctx, '@/api/client', v)
        const names = [arg, 'state', 'setState', 'apis', 'navigate', 'toast', 'refresh'].filter(Boolean).join(', ')
        const values = [arg, 'state: page.get()', 'setState: page.set', `apis: { ${apis.join(', ')} }`, 'navigate', 'toast', 'refresh: () => queryClient.invalidateQueries()'].filter(Boolean).join(', ')
        addImport(ctx, '@/lib/state', 'type CodeScope')
        out.push(`// Your code`, `await (async ({ ${names} }: CodeScope) => {`, ...indent(a.code.split('\n')), `})({ ${values} })`)
        break
      }
      case 'navigate':
        ctx.needsNavigate = true
        out.push(`navigate(${str(a.to)})`)
        break
      case 'toast':
        addImport(ctx, '@/components/ui/toaster', 'toast')
        out.push(`toast(${str(a.message)}, ${toJs(a.tone)})`)
        break
      case 'refresh':
        ctx.needsQueryClient = true
        out.push('await queryClient.invalidateQueries()')
        break
      case 'openUrl':
        out.push(`window.open(${str(a.url)}, '_blank')`)
        break
    }
    if (out.some((l) => l.includes('tpl('))) addImport(ctx, '@/lib/template', 'tpl')
  }
  return out
}

/** A prop value as JSX, resolving {{state.x}} at render time. */
function propAttr(key: string, value: unknown, ctx: PageCtx): string | null {
  if (!hasTemplate(value) || !ctx.usesState) return jsxAttr(key, value, 0)
  if (typeof value === 'string' && !/^\{\{\s*[\w.]+\s*\}\}$/.test(value)) {
    addImport(ctx, '@/lib/template', 'tpl')
    return `${key}={tpl(${toJs(value)}, { state })}`
  }
  addImport(ctx, '@/lib/template', 'bind')
  return `${key}={bind(${toJs(value, 0)}, { state })}`
}

/** Declares (once per page) the hook that loads a GET query and returns its variable name. */
function queryHook(project: Project, qid: string, ctx: PageCtx): string | undefined {
  const q = project.queries.find((x) => x.id === qid)
  if (!q) return undefined
  let v = ctx.queryVars.get(qid)
  if (!v) {
    v = camel(qid)
    ctx.queryVars.set(qid, v)
    const api = sourceVar(project, q.source)
    addImport(ctx, '@/api/client', api)
    addImport(ctx, '@/lib/api', 'useApiQuery')
    let path = toJs(q.path)
    if (q.path.includes('{{') && ctx.usesState) {
      addImport(ctx, '@/lib/template', 'tpl')
      path = `tpl(${toJs(q.path)}, { state })`
    }
    ctx.hooks.push(`const ${v} = useApiQuery(${api}, ${path})`)
  }
  return v
}

function blockLines(project: Project, node: Node, ctx: PageCtx): string[] {
  const def = blockFor(node)
  if (!def) return [`{/* Unknown block "${node.type}" */}`]
  addImport(ctx, def.component.from, def.component.name)
  const attrs: string[] = []
  for (const key of def.passProps) {
    const a = def.type === 'HtmlBlock' ? jsxAttr(key, node.props[key], 0) : propAttr(key, node.props[key], ctx)
    if (a) attrs.push(a)
  }
  if (def.type === 'HtmlBlock' && ctx.usesState && hasTemplate(node.props.html)) attrs.push('scope={{ state }}')
  for (const key of def.readQueries) {
    const qid = node.props[key]
    if (typeof qid !== 'string') continue
    const v = queryHook(project, qid, ctx)
    if (!v) continue
    attrs.push(`data={${v}.data}`)
    if (def.type !== 'Filter') attrs.push(`loading={${v}.isLoading}`)
    if (def.type === 'DataTable') attrs.push(`error={${v}.error?.message}`)
  }
  if (def.type === 'EntityForm') {
    const ids = [...new Set(((node.props.fields as { optionsQuery?: string }[] | undefined) ?? []).map((f) => f.optionsQuery).filter((x): x is string => Boolean(x)))]
    const entries = ids.flatMap((qid) => {
      const v = queryHook(project, qid, ctx)
      return v ? [`${qid}: ${v}.data`] : []
    })
    if (entries.length) attrs.push(`optionData={{ ${entries.join(', ')} }}`)
  }
  const stateKey = def.type === 'Filter' ? String(node.props.stateKey || 'filtro') : ''
  if (stateKey) attrs.push(`value={state[${toJs(stateKey)}]}`)
  for (const ev of def.events) {
    const actions = node.events[ev.name] ?? []
    const body = [...(stateKey && ev.name === 'onChange' ? [`page.set(${toJs(stateKey)}, value)`] : []), ...actionLines(project, actions, ev.arg, ctx)]
    if (!body.length) continue
    const param = ev.arg ? `(${ev.arg})` : '()'
    attrs.push(`${ev.name}={async ${param} => {\n${indent(body).join('\n')}\n}}`)
  }
  const kids = node.children ?? []
  if (def.container === 'overlay') {
    const k = toJs(openKey(node.id))
    attrs.push(`open={Boolean(state[${k}])}`, `onClose={() => page.set(${k}, false)}`)
  }
  if (def.container === 'tabs') {
    attrs.push(`labels={${toJs(kids.map((c, i) => String(c.props.title ?? '') || blockFor(c)?.label || `Pestaña ${i + 1}`))}}`)
  }
  const name = def.component.name
  const multi = attrs.length > 2 || attrs.some((a) => a.includes('\n'))
  const attrLines = multi ? indent(attrs.flatMap((a) => a.split('\n'))) : []
  const inline = attrs.length ? ' ' + attrs.join(' ') : ''
  if (!def.container) return multi ? [`<${name}`, ...attrLines, '/>'] : [`<${name}${inline} />`]
  const inner = kids.flatMap((c) => {
    if (def.container === 'tabs') {
      const cls = styleClass(c.style)
      return cls ? [`<div className="${cls}">`, ...indent(blockLines(project, c, ctx)), '</div>'] : blockLines(project, c, ctx)
    }
    if (blockFor(c)?.container === 'overlay') return blockLines(project, c, ctx)
    const cls = [layoutClass(c.layout), styleClass(c.style)].filter(Boolean).join(' ')
    return [`<div className="${cls}">`, ...indent(blockLines(project, c, ctx)), '</div>']
  })
  const open = multi ? [`<${name}`, ...attrLines, '>'] : [`<${name}${inline}>`]
  return [...open, ...indent(inner), `</${name}>`]
}

function nodeJsx(project: Project, node: Node, index: number, ctx: PageCtx): string {
  // Modals and drawers render in a portal: no grid cell, no entrance animation wrapper.
  if (blockFor(node)?.container === 'overlay') return indent(blockLines(project, node, ctx), 3).join('\n')
  const cls = [layoutClass(node.layout), styleClass(node.style)].filter(Boolean).join(' ')
  const lines = [`<Reveal index={${index}} className="${cls}">`, ...indent(blockLines(project, node, ctx)), '</Reveal>']
  return indent(lines, 3).join('\n')
}

export function pageFile(project: Project, page: Page): { path: string; component: string; code: string } {
  const ctx: PageCtx = { imports: new Map(), hooks: [], needsNavigate: false, needsQueryClient: false, queryVars: new Map(), usesState: pageUsesState(project, page) }
  addImport(ctx, '@/components/ui/reveal', 'Reveal')
  if (ctx.usesState) addImport(ctx, '@/lib/state', 'usePageState')
  const body = page.children.map((n, i) => nodeJsx(project, n, i, ctx)).join('\n')
  if (ctx.needsNavigate) addImport(ctx, 'react-router', 'useNavigate')
  if (ctx.needsQueryClient) addImport(ctx, '@tanstack/react-query', 'useQueryClient')
  const component = `${pascal(page.title)}Page`
  const imports = [...ctx.imports.entries()]
    .sort(([a], [b]) => (a.startsWith('@/') === b.startsWith('@/') ? a.localeCompare(b) : a.startsWith('@/') ? 1 : -1))
    .map(([from, names]) => `import { ${[...names].sort().join(', ')} } from '${from}'`)
  const hooks = [
    ...(ctx.usesState ? [`const page = usePageState(${toJs(page.state ?? {}, 1)})`, 'const state = page.state'] : []),
    ...(ctx.needsNavigate ? ['const navigate = useNavigate()'] : []),
    ...(ctx.needsQueryClient ? ['const queryClient = useQueryClient()'] : []),
    ...ctx.hooks,
  ]
  const code = `${imports.join('\n')}

/** ${page.title} — generated by PanelKit. Edit freely: this file is yours. */
export default function ${component}() {
${hooks.map((h) => `  ${h}`).join('\n')}${hooks.length ? '\n\n' : ''}  return (
    <div className="@container grid grid-cols-12 gap-4 @3xl:gap-6">
${body}
    </div>
  )
}
`
  return { path: `src/pages/${kebab(page.id)}.tsx`, component, code }
}

function mainFile(project: Project, pages: ReturnType<typeof pageFile>[]): string {
  const imports = pages.map((p) => `import ${p.component} from '@/pages/${p.path.slice('src/pages/'.length, -4)}'`)
  const nav = project.pages.map((p) => ({ path: p.path, title: p.title, icon: p.icon }))
  const routes = project.pages.map((p, i) => `      { path: ${toJs(p.path)}, element: <${pages[i]!.component} /> },`)
  return `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppShell, type NavItem } from '@/layout/app-shell'
import { Toaster } from '@/components/ui/toaster'
import { ConfirmHost } from '@/components/ui/confirm'
${imports.join('\n')}
import '@/index.css'

const nav: NavItem[] = ${toJs(nav, 0)}

const router = createBrowserRouter([
  {
    element: <AppShell name=${JSON.stringify(project.name)} nav={nav} mode=${JSON.stringify(project.theme.mode)} />,
    children: [
${routes.join('\n')}
    ],
  },
])

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <ConfirmHost />
    </QueryClientProvider>
  </StrictMode>,
)
`
}

function readme(project: Project, env: string[]): string {
  const envBlock = env.length
    ? `\n2. Copy \`.env.example\` to \`.env\` and fill in:\n\n${env.map((e) => `   - \`${ENV_PREFIX}${e}\``).join('\n')}\n`
    : ''
  return `# ${project.name}

Generated with [PanelKit](https://github.com/Gauido/panelkit), an open-source visual builder.
This is a plain React app: every file is yours to edit.

## Run it

1. \`npm install\`${envBlock}
${env.length ? '3' : '2'}. \`npm run dev\` and open http://localhost:5173

## Stack

React 19 · Vite · Tailwind CSS v4 · TanStack Query · React Router · Motion · lucide-react

## Where things live

| Path | What |
| --- | --- |
| \`src/pages/\` | One file per page you designed |
| \`src/api/client.ts\` | API clients for your data sources |
| \`src/components/blocks/\` | Reusable blocks (table, KPI, form, button) |
| \`src/components/ui/\` | Base UI primitives |
| \`src/theme.css\` | Colors, radius and dark mode tokens |
| \`panelkit.json\` | The project file: import it back into PanelKit to keep designing |
`
}

export function generate(project: Project, runtime: RuntimeFiles): GeneratedFiles {
  const env = envVars(project)
  const files: GeneratedFiles = {}
  const slug = kebab(project.name)

  for (const [path, content] of Object.entries(runtime)) {
    if (path === 'index.ts') continue
    files[`src/${path}`] = content
  }

  const pages = project.pages.map((p) => pageFile(project, p))
  for (const p of pages) files[p.path] = p.code

  files['src/api/client.ts'] = apiClient(project)
  const sample = sampleDataFile(project)
  if (sample) files['src/api/sample-data.ts'] = sample
  files['src/main.tsx'] = mainFile(project, pages)
  files['src/vite-env.d.ts'] = '/// <reference types="vite/client" />\n'
  const font = fonts[project.theme.font]
  const vars = Object.entries(themeVars(project.theme)).map(([k, v]) => `  ${k}: ${v};`).join('\n')
  const cssDeps = project.dependencies.filter((d) => d.kind === 'css' && d.css).map((d) => `@import '${d.name}/${d.css!.replace(/^\/+/, '')}';`)
  const plugins = project.dependencies.filter((d) => d.kind === 'tailwind-plugin').map((d) => `@plugin '${d.name}';`)
  files['src/index.css'] = [
    ...cssDeps,
    "@import 'tailwindcss';",
    ...plugins,
    `@import '${font.pkg}';`,
    "@import './theme.css';",
    ...(project.customCss.trim() ? ["@import './custom.css';"] : []),
    '',
    `:root,\n.dark {\n${vars}\n}`,
    '',
  ].join('\n')
  if (project.customCss.trim()) files['src/custom.css'] = project.customCss.trim() + '\n'
  files['index.html'] = `<!doctype html>
<html lang="es" data-accent="${project.theme.accent}" data-surface="${project.theme.surface}" data-motion="${project.theme.motion}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${project.name.replace(/</g, '&lt;')}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
  files['package.json'] =
    JSON.stringify(
      {
        name: slug,
        private: true,
        version: '0.1.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview' },
        dependencies: Object.fromEntries(
          Object.entries({
            ...Object.fromEntries(Object.entries(runtimeDeps).filter(([k]) => !k.startsWith('@fontsource-variable/'))),
            [font.pkg]: '^5.3.0',
            ...Object.fromEntries(project.dependencies.map((d) => [d.name, d.version || 'latest'])),
          }).sort(([a], [b]) => a.localeCompare(b)),
        ),
        devDependencies: Object.fromEntries(Object.entries(devDeps).filter(([k]) => !project.dependencies.some((d) => d.name === k))),
      },
      null,
      2,
    ) + '\n'
  files['vite.config.ts'] = `import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
`
  files['tsconfig.json'] =
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2023', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          isolatedModules: true,
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] },
          types: ['vite/client'],
        },
        include: ['src'],
      },
      null,
      2,
    ) + '\n'
  files['.gitignore'] = 'node_modules\ndist\n.env\n'
  files['.env.example'] = env.length ? env.map((e) => `${ENV_PREFIX}${e}=`).join('\n') + '\n' : '# No environment variables needed\n'
  files['README.md'] = readme(project, env)
  files['panelkit.json'] = JSON.stringify(project, null, 2) + '\n'
  return files
}
