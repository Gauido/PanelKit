import { useQuery } from '@tanstack/react-query'

export type Api = {
  baseUrl: string
  headers: Record<string, string>
  request: <T = unknown>(method: string, path: string, body?: unknown) => Promise<T>
}

export function createApi(baseUrl: string, headers: Record<string, string> = {}): Api {
  const root = baseUrl.replace(/\/+$/, '')
  return {
    baseUrl: root,
    headers,
    async request<T>(method: string, path: string, body?: unknown): Promise<T> {
      const res = await fetch(`${root}${path.startsWith('/') ? path : `/${path}`}`, {
        method,
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${res.statusText}`)
      const text = await res.text()
      return (text ? JSON.parse(text) : null) as T
    },
  }
}

/**
 * An API backed by sample data kept in memory. GET /name returns a collection,
 * POST/PUT/PATCH/DELETE /name[/id] change it until the page reloads.
 */
export function createMockApi(tables: Record<string, Record<string, unknown>[]>, name = 'mock'): Api {
  const db: Record<string, Record<string, unknown>[]> = structuredClone(tables)
  const delay = () => new Promise((r) => setTimeout(r, 250))
  return {
    baseUrl: `mock://${name}`,
    headers: {},
    async request<T>(method: string, path: string, body?: unknown): Promise<T> {
      await delay()
      const [table = '', id] = path.replace(/^\/+/, '').split('/')
      const rows = (db[table] ??= [])
      const find = () => rows.findIndex((r) => String(r.id) === id)
      switch (method.toUpperCase()) {
        case 'GET':
          return structuredClone(id ? rows[find()] : rows) as T
        case 'POST': {
          const row = { id: rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1, ...(body as object) }
          rows.unshift(row)
          return row as T
        }
        case 'PUT':
        case 'PATCH': {
          const i = find()
          if (i >= 0) rows[i] = { ...rows[i], ...(body as object) }
          return rows[i] as T
        }
        case 'DELETE': {
          const i = find()
          if (i >= 0) rows.splice(i, 1)
          return null as T
        }
        default:
          throw new Error(`Unsupported method ${method}`)
      }
    },
  }
}

export function useApiQuery<T = unknown>(api: Api | undefined, path: string | undefined) {
  return useQuery({
    queryKey: [api?.baseUrl, path],
    queryFn: () => api!.request<T>('GET', path!),
    enabled: Boolean(api && path),
  })
}
