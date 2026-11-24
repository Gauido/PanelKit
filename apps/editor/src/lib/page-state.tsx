import { createContext, useContext, type ReactNode } from 'react'
import { usePageState, type PageState } from '@panelkit/blocks'

const Ctx = createContext<PageState | null>(null)

/** Page variables while designing / testing, same as `usePageState` in the exported page. */
export function PageStateProvider({ initial, children }: { initial: Record<string, unknown>; children: ReactNode }) {
  const page = usePageState(initial)
  return <Ctx.Provider value={page}>{children}</Ctx.Provider>
}

const fallback: PageState = { state: {}, get: () => ({}), set: () => {} }

export function usePage(): PageState {
  return useContext(Ctx) ?? fallback
}
