import { useQuery } from '@tanstack/react-query'
import { getSession } from './auth'

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
      // Signed in: send the token, unless the data source sets its own Authorization header.
      const token = getSession()?.token
      const auth: Record<string, string> = token && !Object.keys(headers).some((h) => h.toLowerCase() === 'authorization') ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${root}${path.startsWith('/') ? path : `/${path}`}`, {
        method,
        headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...auth, ...headers },
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
 * GET /name?field=value filters it, POST/PUT/PATCH/DELETE /name[/id] change it until the page reloads.
 */
export function createMockApi(tables: Record<string, Record<string, unknown>[]>, name = 'mock'): Api {
  const db: Record<string, Record<string, unknown>[]> = structuredClone(tables)
  const delay = () => new Promise((r) => setTimeout(r, 250))
  return {
    baseUrl: `mock://${name}`,
    headers: {},
    async request<T>(method: string, path: string, body?: unknown): Promise<T> {
      await delay()
      const [route = '', search = ''] = path.split('?')
      const [table = '', id] = route.replace(/^\/+/, '').split('/')
      // Demo login: POST /auth/login checks the "users" table (email + password).
      if (table === 'auth' && id === 'login' && method.toUpperCase() === 'POST') {
        const b = (body ?? {}) as Record<string, unknown>
        const email = String(b.email ?? b.username ?? b.user ?? '').trim().toLowerCase()
        const user = (db.users ?? []).find((u) => String(u.email ?? '').toLowerCase() === email && String(u.password ?? '') === String(b.password ?? ''))
        if (!user) throw new Error('401 Email o contraseña incorrectos')
        const { password: _omit, ...safe } = user
        return { token: `demo-${String(user.id)}`, user: safe } as T
      }
      const rows = (db[table] ??= [])
      // "/bookings?court=Cancha 1&status=" keeps rows that match every non-empty param.
      const filters = [...new URLSearchParams(search)].filter(([, v]) => v !== '')
      const find = () => rows.findIndex((r) => String(r.id) === id)
      switch (method.toUpperCase()) {
        case 'GET':
          if (id) return structuredClone(rows[find()]) as T
          return structuredClone(rows.filter((r) => filters.every(([k, v]) => String(r[k] ?? '') === v))) as T
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
