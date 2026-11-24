import { create } from 'zustand'
import { crmTemplate, newId, Project, templates, type Node, type Page } from '@panelkit/schema'
import { registry } from '@panelkit/exporter'

const INDEX_KEY = 'panelkit:projects'
const projectKey = (id: string) => `panelkit:project:${id}`
const HISTORY_LIMIT = 100

export type ProjectMeta = { id: string; name: string; template: string; updatedAt: number; primary: string; font: string; pages: number; blocks: number }

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage may be unavailable */
  }
}

function loadIndex(): ProjectMeta[] {
  try {
    return JSON.parse(safeGet(INDEX_KEY) ?? '[]') as ProjectMeta[]
  } catch {
    return []
  }
}

function loadProject(id: string): Project | null {
  try {
    const raw = safeGet(projectKey(id))
    return raw ? Project.parse(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function metaFor(id: string, template: string, p: Project): ProjectMeta {
  return {
    id,
    name: p.name,
    template,
    updatedAt: Date.now(),
    primary: p.theme.primary ?? p.theme.accent,
    font: p.theme.font,
    pages: p.pages.length,
    blocks: p.pages.reduce((n, pg) => n + pg.children.length, 0),
  }
}

type State = {
  /** null = the projects home screen. */
  projectId: string | null
  projects: ProjectMeta[]
  openProject: (id: string) => void
  createProject: (opts: { template: string; name: string; theme?: Partial<Project['theme']> }) => string
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => void
  closeProject: () => void

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
  // Migrate the single-project storage used by the first alpha.
  const legacy = safeGet('panelkit:project')
  if (legacy && !safeGet(INDEX_KEY)) {
    try {
      const p = Project.parse(JSON.parse(legacy))
      const id = newId('prj')
      safeSet(projectKey(id), JSON.stringify(p))
      safeSet(INDEX_KEY, JSON.stringify([metaFor(id, 'crm', p)]))
    } catch {
      /* ignore */
    }
  }
  const initial = structuredClone(crmTemplate)
  const saveIndex = (list: ProjectMeta[]) => {
    set({ projects: list })
    safeSet(INDEX_KEY, JSON.stringify(list))
  }
  const persist = (p: Project) => {
    const id = get().projectId
    if (!id) return
    safeSet(projectKey(id), JSON.stringify(p))
    saveIndex(get().projects.map((m) => (m.id === id ? metaFor(id, m.template, p) : m)))
  }
  const commit = (next: Project) => {
    const { project, past } = get()
    set({ project: next, past: [...past, project].slice(-HISTORY_LIMIT), future: [] })
    persist(next)
  }
  const currentPage = (p: Project): Page => p.pages.find((x) => x.id === get().pageId) ?? p.pages[0]!

  return {
    projectId: null,
    projects: loadIndex().sort((a, b) => b.updatedAt - a.updatedAt),
    openProject: (id) => {
      const p = loadProject(id)
      if (!p) return
      set({ projectId: id, project: p, past: [], future: [], pageId: p.pages[0]!.id, selectedId: null, preview: false })
    },
    createProject: ({ template, name, theme }) => {
      const t = templates.find((x) => x.id === template) ?? templates[0]!
      const p = structuredClone(t.project)
      p.name = name.trim() || t.name
      if (theme) p.theme = { ...p.theme, ...theme }
      const id = newId('prj')
      safeSet(projectKey(id), JSON.stringify(p))
      saveIndex([metaFor(id, t.id, p), ...get().projects])
      return id
    },
    deleteProject: (id) => {
      try {
        localStorage.removeItem(projectKey(id))
      } catch {
        /* ignore */
      }
      saveIndex(get().projects.filter((m) => m.id !== id))
    },
    duplicateProject: (id) => {
      const p = loadProject(id)
      const meta = get().projects.find((m) => m.id === id)
      if (!p || !meta) return
      p.name = `${p.name} (copia)`
      const copy = newId('prj')
      safeSet(projectKey(copy), JSON.stringify(p))
      saveIndex([metaFor(copy, meta.template, p), ...get().projects])
    },
    closeProject: () => set({ projectId: null, preview: false, selectedId: null }),

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
      persist(prev)
    },
    redo: () => {
      const { past, project, future } = get()
      const next = future[0]
      if (!next) return
      set({ project: next, past: [...past, project], future: future.slice(1) })
      persist(next)
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
      const meta = get().projects.find((m) => m.id === get().projectId)
      const t = templates.find((x) => x.id === meta?.template) ?? templates[0]!
      const fresh = structuredClone(t.project)
      fresh.name = get().project.name
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
