import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Reads "address.city" style paths from a row. */
export function getPath(row: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, row)
}

export function toRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  if (data && typeof data === 'object') {
    // Common API envelopes: { data: [...] }, { items: [...] }, { results: [...] }
    for (const key of ['data', 'items', 'results', 'rows']) {
      const inner = (data as Record<string, unknown>)[key]
      if (Array.isArray(inner)) return inner as Record<string, unknown>[]
    }
    return [data as Record<string, unknown>]
  }
  return []
}
