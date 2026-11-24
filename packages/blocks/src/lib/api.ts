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

export function useApiQuery<T = unknown>(api: Api | undefined, path: string | undefined) {
  return useQuery({
    queryKey: [api?.baseUrl, path],
    queryFn: () => api!.request<T>('GET', path!),
    enabled: Boolean(api && path),
  })
}
