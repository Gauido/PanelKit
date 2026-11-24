import { create } from 'zustand'
import { crmTemplate, newId, Project, type Node, type Page } from '@panelkit/schema'
import { registry } from '@panelkit/exporter'

const STORAGE_KEY = 'panelkit:project'
const HISTORY_LIMIT = 100

function load(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return Project.parse(JSON.parse(raw))
  } catch {
    /* fall back to the template */
  }
  return structuredClone(crmTemplate)
}

type State = {
  project: Project
  past: Project[]
  future: Project[]
  pageId: string
  selectedId: string | null
  preview: boolean
  /** Values for {{env.X}} used while designing. Never exported. */
  env: Record<string, string>

  setProject: (next: Project, opts?: { record?: boolean }) => void
  update: (fn: (draft: Project) => void) => void
  undo: () => void
  redo: () => void

  selectPage: (id: string) => void
  select: (id: string | null) => void
  setPreview: (on: boolean) => void
  setEnv: (name: string, value: string) => void

  addNode: (type: string, index?: number) => void
  moveNode: (from: number, to: number) => void
  updateNode: (id: string, fn: (node: Node) => void) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  addPage: () => void
  removePage: (id: string) => void
  reset: () => void
}

export const useEditor = create<State>((set, get) => {
  const initial = load()
  const commit = (next: Project) => {
    const { project, past } = get()
    set({ project: next, past: [...past, project].slice(-HISTORY_LIMIT), future: [] })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage may be unavailable */
    }
  }
  const currentPage = (p: Project): Page => p.pages.find((x) => x.id === get().pageId) ?? p.pages[0]!

  return {
    project: initial,
    past: [],
    future: [],
    pageId: initial.pages[0]!.id,
    selectedId: null,
    preview: false,
    env: {},

    setProject: (next) => {
      commit(next)
      if (!next.pages.some((p) => p.id === get().pageId)) set({ pageId: next.pages[0]!.id, selectedId: null })
    },
    update: (fn) => {
      const draft = structuredClone(get().project)
      fn(draft)
      commit(draft)
    },
    undo: () => {
      const { past, project, future } = get()
      const prev = past.at(-1)
      if (!prev) return
      set({ project: prev, past: past.slice(0, -1), future: [project, ...future] })
    },
    redo: () => {
      const { past, project, future } = get()
      const next = future[0]
      if (!next) return
      set({ project: next, past: [...past, project], future: future.slice(1) })
    },

    selectPage: (id) => set({ pageId: id, selectedId: null }),
    select: (id) => set({ selectedId: id }),
    setPreview: (on) => set({ preview: on, selectedId: null }),
    setEnv: (name, value) => set({ env: { ...get().env, [name]: value } }),

    addNode: (type, index) => {
      const def = registry[type]
      if (!def) return
      const node: Node = { id: newId(), type, layout: { span: def.defaultSpan }, props: structuredClone(def.defaultProps), style: {}, events: {} }
      get().update((p) => {
        const page = currentPage(p)
        page.children.splice(index ?? page.children.length, 0, node)
      })
      set({ selectedId: node.id })
    },
    moveNode: (from, to) =>
      get().update((p) => {
        const list = currentPage(p).children
        const [item] = list.splice(from, 1)
        if (item) list.splice(to, 0, item)
      }),
    updateNode: (id, fn) =>
      get().update((p) => {
        for (const page of p.pages) {
          const node = page.children.find((n) => n.id === id)
          if (node) fn(node)
        }
      }),
    removeNode: (id) => {
      get().update((p) => {
        for (const page of p.pages) page.children = page.children.filter((n) => n.id !== id)
      })
      set({ selectedId: null })
    },
    duplicateNode: (id) => {
      const copyId = newId()
      get().update((p) => {
        const list = currentPage(p).children
        const i = list.findIndex((n) => n.id === id)
        if (i >= 0) list.splice(i + 1, 0, { ...structuredClone(list[i]!), id: copyId })
      })
      set({ selectedId: copyId })
    },
    addPage: () => {
      const id = newId('page')
      get().update((p) => {
        const n = p.pages.length + 1
        p.pages.push({ id, path: `/pagina-${n}`, title: `Página ${n}`, icon: 'LayoutDashboard', children: [] })
      })
      set({ pageId: id, selectedId: null })
    },
    removePage: (id) => {
      if (get().project.pages.length <= 1) return
      get().update((p) => {
        p.pages = p.pages.filter((x) => x.id !== id)
      })
      set({ pageId: get().project.pages[0]!.id, selectedId: null })
    },
    reset: () => {
      const fresh = structuredClone(crmTemplate)
      commit(fresh)
      set({ pageId: fresh.pages[0]!.id, selectedId: null })
    },
  }
})

export function useCurrentPage(): Page {
  return useEditor((s) => s.project.pages.find((p) => p.id === s.pageId) ?? s.project.pages[0]!)
}

export function useSelectedNode(): Node | undefined {
  return useEditor((s) => {
    if (!s.selectedId) return undefined
    for (const page of s.project.pages) {
      const n = page.children.find((x) => x.id === s.selectedId)
      if (n) return n
    }
    return undefined
  })
}
