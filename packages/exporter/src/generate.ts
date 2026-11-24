import { envVars, type Action, type Node, type Page, type Project } from '@panelkit/schema'
import { blockFor } from './registry'
import { spanClass, styleClass } from './layout'
import { camel, jsxAttr, kebab, pascal, toJs } from './codegen'
import { devDeps, runtimeDeps } from './versions'

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

function apiClient(project: Project): string {
  const lines = ["import { createApi } from '@/lib/api'", '']
  for (const ds of project.dataSources) {
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
}

function addImport(ctx: PageCtx, from: string, name: string) {
  if (!ctx.imports.has(from)) ctx.imports.set(from, new Set())
  ctx.imports.get(from)!.add(name)
}

function actionLines(project: Project, actions: Action[], arg: string | undefined, ctx: PageCtx): string[] {
  const scope = arg ? `{ ${arg} }` : '{}'
  const str = (s: string) => (/\{\{/.test(s) ? `tpl(${toJs(s)}, ${scope})` : toJs(s))
  const out: string[] = []
  for (const a of actions) {
    switch (a.type) {
      case 'callQuery': {
        const q = project.queries.find((x) => x.id === a.query)
        if (!q) break
        const api = sourceVar(project, q.source)
        addImport(ctx, '@/api/client', api)
        const body = a.body === 'none' || !arg ? '' : `, ${a.body === 'row' ? (arg === 'row' ? 'row' : 'undefined') : arg === 'values' ? 'values' : 'undefined'}`
        const path = /\{\{/.test(q.path) ? `tpl(${toJs(q.path)}, ${scope})` : toJs(q.path)
        out.push(`await ${api}.request(${toJs(q.method)}, ${path}${body})`)
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

function nodeJsx(project: Project, node: Node, index: number, ctx: PageCtx): string {
  const def = blockFor(node)
  if (!def) return `        {/* Unknown block "${node.type}" */}`
  addImport(ctx, def.component.from, def.component.name)
  const attrs: string[] = []
  for (const key of def.passProps) {
    const a = jsxAttr(key, node.props[key], 5)
    if (a) attrs.push(a)
  }
  for (const key of def.readQueries) {
    const qid = node.props[key]
    if (typeof qid !== 'string') continue
    const q = project.queries.find((x) => x.id === qid)
    if (!q) continue
    let v = ctx.queryVars.get(qid)
    if (!v) {
      v = camel(qid)
      ctx.queryVars.set(qid, v)
      const api = sourceVar(project, q.source)
      addImport(ctx, '@/api/client', api)
      addImport(ctx, '@/lib/api', 'useApiQuery')
      ctx.hooks.push(`const ${v} = useApiQuery(${api}, ${toJs(q.path)})`)
    }
    attrs.push(`data={${v}.data}`, `loading={${v}.isLoading}`)
    if (def.type === 'DataTable') attrs.push(`error={${v}.error?.message}`)
  }
  for (const ev of def.events) {
    const actions = node.events[ev.name]
    if (!actions?.length) continue
    const body = actionLines(project, actions, ev.arg, ctx)
    if (!body.length) continue
    const param = ev.arg === 'row' ? '(row)' : ev.arg === 'values' ? '(values)' : '()'
    attrs.push(`${ev.name}={async ${param} => {\n${body.map((l) => `            ${l}`).join('\n')}\n          }}`)
  }
  const cls = [spanClass(node.layout.span), styleClass(node.style)].filter(Boolean).join(' ')
  const open = attrs.length > 2 || attrs.some((a) => a.includes('\n'))
    ? `<${def.component.name}\n${attrs.map((a) => `          ${a}`).join('\n')}\n        />`
    : `<${def.component.name}${attrs.length ? ' ' + attrs.join(' ') : ''} />`
  return `      <Reveal index={${index}} className="${cls}">\n        ${open}\n      </Reveal>`
}

export function pageFile(project: Project, page: Page): { path: string; component: string; code: string } {
  const ctx: PageCtx = { imports: new Map(), hooks: [], needsNavigate: false, needsQueryClient: false, queryVars: new Map() }
  addImport(ctx, '@/components/ui/reveal', 'Reveal')
  const body = page.children.map((n, i) => nodeJsx(project, n, i, ctx)).join('\n')
  if (ctx.needsNavigate) addImport(ctx, 'react-router', 'useNavigate')
  if (ctx.needsQueryClient) addImport(ctx, '@tanstack/react-query', 'useQueryClient')
  const component = `${pascal(page.title)}Page`
  const imports = [...ctx.imports.entries()]
    .sort(([a], [b]) => (a.startsWith('@/') === b.startsWith('@/') ? a.localeCompare(b) : a.startsWith('@/') ? 1 : -1))
    .map(([from, names]) => `import { ${[...names].sort().join(', ')} } from '${from}'`)
  const hooks = [
    ...(ctx.needsNavigate ? ['const navigate = useNavigate()'] : []),
    ...(ctx.needsQueryClient ? ['const queryClient = useQueryClient()'] : []),
    ...ctx.hooks,
  ]
  const code = `${imports.join('\n')}

/** ${page.title} — generated by PanelKit. Edit freely: this file is yours. */
export default function ${component}() {
${hooks.map((h) => `  ${h}`).join('\n')}${hooks.length ? '\n\n' : ''}  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
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
  files['src/main.tsx'] = mainFile(project, pages)
  files['src/vite-env.d.ts'] = '/// <reference types="vite/client" />\n'
  files['src/index.css'] = `@import 'tailwindcss';
@import '@fontsource-variable/inter';
@import './theme.css';

:root {
  --radius: ${project.theme.radius}px;
}
`
  files['index.html'] = `<!doctype html>
<html lang="es" data-accent="${project.theme.accent}">
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
        dependencies: runtimeDeps,
        devDependencies: devDeps,
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
