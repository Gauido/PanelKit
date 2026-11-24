import { useCallback, useMemo, useRef, useState } from 'react'

export type PageState = {
  /** Current values, for rendering. */
  state: Record<string, unknown>
  /** Latest values, for code that runs after a `set` in the same event. */
  get: () => Record<string, unknown>
  set: (key: string, value: unknown) => void
}

/** Page variables: what was clicked, which modal is open, filters… Read them as {{state.x}}. */
export function usePageState(initial: Record<string, unknown> = {}): PageState {
  const [state, setState] = useState(initial)
  const ref = useRef(state)
  const set = useCallback((key: string, value: unknown) => {
    ref.current = { ...ref.current, [key]: value }
    setState(ref.current)
  }, [])
  const get = useCallback(() => ref.current, [])
  return useMemo(() => ({ state, get, set }), [state, get, set])
}

/**
 * What custom code ("Ejecutar código propio") receives: the event data (row, values, slot…),
 * state, setState, apis, navigate, toast and refresh. Loosely typed on purpose, like a script.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CodeScope = Record<string, any>
