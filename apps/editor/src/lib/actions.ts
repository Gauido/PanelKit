import type { QueryClient } from '@tanstack/react-query'
import { confirm, createApi, createMockApi, toast, tpl, type Api } from '@panelkit/blocks'
import { resolveEnv, type Action, type Project } from '@panelkit/schema'

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
}

/** Runs an event's action list in the editor. The exporter prints the same list as code. */
export async function runActions(actions: Action[] | undefined, scope: Record<string, unknown>, ctx: Ctx) {
  for (const a of actions ?? []) {
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
