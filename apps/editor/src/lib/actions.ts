import type { QueryClient } from '@tanstack/react-query'
import { confirm, createApi, createMockApi, resolve, toast, tpl, type Api, type PageState } from '@panelkit/blocks'
import { camel } from '@panelkit/exporter'
import { openKey, resolveEnv, type Action, type Project } from '@panelkit/schema'

// Keep one in-memory API per sample source so created rows survive re-renders.
const mocks = new Map<string, { tables: unknown; api: Api }>()

export function apiFor(project: Project, sourceId: string, env: Record<string, string>): Api | undefined {
  const ds = project.dataSources.find((d) => d.id === sourceId)
  if (!ds) return undefined
  if (ds.type === 'static') {
    const cached = mocks.get(ds.id)
    if (cached && cached.tables === ds.tables) return cached.api
    const api = createMockApi(ds.tables, ds.id)
    mocks.set(ds.id, { tables: ds.tables, api })
    return api
  }
  const headers = Object.fromEntries(Object.entries(ds.headers).map(([k, v]) => [k, resolveEnv(v, env)]))
  return createApi(resolveEnv(ds.baseUrl, env), headers)
}

type Ctx = {
  project: Project
  env: Record<string, string>
  navigate: (to: string) => void
  queryClient: QueryClient
  page: PageState
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<unknown>


/** Runs an event's action list in the editor. The exporter prints the same list as code. */
export async function runActions(actions: Action[] | undefined, args: Record<string, unknown>, ctx: Ctx) {
  for (const a of actions ?? []) {
    // Re-read state before each step, so a value set by a previous step is visible.
    const scope: Record<string, unknown> = { ...args, state: ctx.page.get() }
    try {
      switch (a.type) {
        case 'callQuery': {
          const q = ctx.project.queries.find((x) => x.id === a.query)
          const api = q && apiFor(ctx.project, q.source, ctx.env)
          if (!q || !api) throw new Error('La consulta no existe')
          const body = a.body === 'none' ? undefined : scope[a.body]
          await api.request(q.method, tpl(q.path, scope), body)
          break
        }
        case 'setState':
          ctx.page.set(a.key, resolve(a.value, scope))
          break
        case 'openModal':
        case 'closeModal':
          ctx.page.set(openKey(a.target), a.type === 'openModal')
          break
        case 'runCode': {
          const apis = Object.fromEntries(ctx.project.dataSources.map((d) => [camel(d.name) || 'api', apiFor(ctx.project, d.id, ctx.env)]))
          const helpers = {
            ...args,
            state: ctx.page.get(),
            setState: ctx.page.set,
            apis,
            navigate: ctx.navigate,
            toast,
            refresh: () => ctx.queryClient.invalidateQueries(),
          }
          const fn = new AsyncFunction(...Object.keys(helpers), a.code)
          await fn(...Object.values(helpers))
          break
        }
        case 'confirm':
          if (!(await confirm(tpl(a.message, scope)))) return
          break
        case 'navigate':
          ctx.navigate(tpl(a.to, scope))
          break
        case 'toast':
          toast(tpl(a.message, scope), a.tone)
          break
        case 'refresh':
          await ctx.queryClient.invalidateQueries()
          break
        case 'openUrl':
          window.open(tpl(a.url, scope), '_blank')
          break
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error')
      throw err
    }
  }
}
