import { create } from 'zustand'
import { crmTemplate, newId, Project, templates, walkNodes, type Node, type Page } from '@panelkit/schema'
import { registry, type Device } from '@panelkit/exporter'

const INDEX_KEY = 'panelkit:projects'
const projectKey = (id: string) => `panelkit:project:${id}`
const HISTORY_LIMIT = 100

/** Where a dragged block lands. */
export type DropTarget = { parentId?: string | null; beforeId?: string; afterId?: string }

/** The list that holds `id` (page or container children) and its index. */
export function locate(nodes: Node[], id: string): { list: Node[]; index: number } | null {
  const index = nodes.findIndex((n) => n.id === id)
  if (index >= 0) return { list: nodes, index }
  for (const n of nodes) {
    const hit = n.children && locate(n.children, id)
    if (hit) return hit
  }
  return null
}

function findNode(nodes: Node[], id: string): Node | undefined {
  for (const n of walkNodes(nodes)) if (n.id === id) return n
  return undefined
}

function targetList(page: Page, target: DropTarget | undefined): { list: Node[]; index: number } {
  if (target?.afterId) {
    const hit = locate(page.children, target.afterId)
    if (hit) return { list: hit.list, index: hit.index + 1 }
  }
  if (target?.beforeId) {
    const hit = locate(page.children, target.beforeId)
    if (hit) return hit
  }
  if (target?.parentId) {
    const parent = findNode(page.children, target.parentId)
    if (parent) return { list: (parent.children ??= []), index: parent.children.length }
  }
  return { list: page.children, index: page.children.length }
}

function freshIds(node: Node): Node {
  return { ...node, id: newId(), children: node.children?.map(freshIds) }
}

function makeNode(type: string): Node | null {
  const def = registry[type]
  if (!def) return null
  const node: Node = { id: newId(), type, layout: { span: def.defaultSpan }, props: structuredClone(def.defaultProps), style: {}, events: {} }
  if (def.container) node.children = []
  if (def.container === 'tabs') {
    node.children = [1, 2].map((i) => ({ ...makeNode('Section')!, props: { title: `Pestaña ${i}`, card: false } }))
  }
  return node
}

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
    blocks: p.pages.reduce((n, pg) => n + [...walkNodes(pg.children)].length, 0),
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
  /** Screen size being designed / tested. Block widths edited on the canvas apply to it. */
  device: Device
  setDevice: (d: Device) => void
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

  /** Adds a block before `beforeId`, or at the end of `parentId` (a container) or of the page. */
  addNode: (type: string, target?: DropTarget) => void
  moveNode: (id: string, target: DropTarget) => void
  updateNode: (id: string, fn: (node: Node) => void) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  /** Copied block (with its children), pasted with fresh ids. */
  clipboard: Node | null
  copyNode: (id: string) => void
  pasteNode: (target?: DropTarget) => void
  /** Moves a block one place earlier (-1) or later (+1) among its siblings. */
  nudgeNode: (id: string, by: -1 | 1) => void
  /** Puts a block inside a new Section, in the same place. */
  wrapInSection: (id: string) => void
  /** Takes the blocks out of a container and puts them where the container was. */
  unwrapNode: (id: string) => void
  setSpanFor: (id: string, device: Device, span: number) => void
  /** Moves a block (and what's inside it) to the end of another page. */
  moveToPage: (id: string, pageId: string) => void
  /** Copied look (style + widths) to paste onto other blocks. */
  styleClipboard: Pick<Node, 'style' | 'layout'> | null
  copyStyle: (id: string) => void
  pasteStyle: (id: string) => void
  toggleHidden: (id: string, device: Device) => void
  /** Block picker ("+" buttons, right click > Agregar). null = closed. */
  picker: DropTarget | null
  openPicker: (target: DropTarget | null) => void
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
    device: 'desktop',
    setDevice: (device) => set({ device }),
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

    addNode: (type, target) => {
      const node = makeNode(type)
      if (!node) return
      get().update((p) => {
        const { list, index } = targetList(currentPage(p), target)
        list.splice(index, 0, node)
      })
      set({ selectedId: node.id })
    },
    moveNode: (id, target) =>
      get().update((p) => {
        const page = currentPage(p)
        const from = locate(page.children, id)
        if (!from || target.beforeId === id || target.afterId === id) return
        const moving = from.list[from.index]!
        // A container can't go inside itself.
        const inside = new Set([...walkNodes([moving])].map((n) => n.id))
        if ([target.parentId, target.beforeId, target.afterId].some((x) => x && inside.has(x))) return
        from.list.splice(from.index, 1)
        const { list, index } = targetList(page, target)
        list.splice(index, 0, moving)
      }),
    updateNode: (id, fn) =>
      get().update((p) => {
        for (const page of p.pages) {
          const node = findNode(page.children, id)
          if (node) fn(node)
        }
      }),
    removeNode: (id) => {
      get().update((p) => {
        for (const page of p.pages) {
          const hit = locate(page.children, id)
          if (hit) hit.list.splice(hit.index, 1)
        }
      })
      set({ selectedId: null })
    },
    duplicateNode: (id) => {
      let copyId = ''
      get().update((p) => {
        const hit = locate(currentPage(p).children, id)
        if (!hit) return
        const copy = freshIds(structuredClone(hit.list[hit.index]!))
        copyId = copy.id
        hit.list.splice(hit.index + 1, 0, copy)
      })
      if (copyId) set({ selectedId: copyId })
    },
    clipboard: null,
    copyNode: (id) => {
      for (const page of get().project.pages) {
        const n = findNode(page.children, id)
        if (n) return set({ clipboard: structuredClone(n) })
      }
    },
    pasteNode: (target) => {
      const clip = get().clipboard
      if (!clip) return
      const copy = freshIds(structuredClone(clip))
      get().update((p) => {
        const { list, index } = targetList(currentPage(p), target)
        list.splice(index, 0, copy)
      })
      set({ selectedId: copy.id })
    },
    nudgeNode: (id, by) =>
      get().update((p) => {
        const hit = locate(currentPage(p).children, id)
        if (!hit) return
        const to = hit.index + by
        if (to < 0 || to >= hit.list.length) return
        const [n] = hit.list.splice(hit.index, 1)
        hit.list.splice(to, 0, n!)
      }),
    wrapInSection: (id) => {
      const section = makeNode('Section')
      if (!section) return
      get().update((p) => {
        const hit = locate(currentPage(p).children, id)
        if (!hit) return
        const inner = hit.list[hit.index]!
        section.layout = { ...inner.layout }
        inner.layout = { span: 12 }
        section.children = [inner]
        hit.list.splice(hit.index, 1, section)
      })
      set({ selectedId: section.id })
    },
    unwrapNode: (id) =>
      get().update((p) => {
        const hit = locate(currentPage(p).children, id)
        if (!hit) return
        const n = hit.list[hit.index]!
        hit.list.splice(hit.index, 1, ...(n.children ?? []))
      }),
    setSpanFor: (id, device, span) =>
      get().updateNode(id, (n) => {
        const v = Math.min(12, Math.max(1, span))
        if (device === 'desktop') n.layout.span = v
        else if (device === 'tablet') n.layout.spanTablet = v
        else n.layout.spanMobile = v
      }),
    toggleHidden: (id, device) =>
      get().updateNode(id, (n) => {
        const hide = new Set(n.layout.hide ?? [])
        if (hide.has(device)) hide.delete(device)
        else hide.add(device)
        n.layout.hide = hide.size ? [...hide] : undefined
      }),
    moveToPage: (id, pageId) => {
      get().update((p) => {
        const to = p.pages.find((x) => x.id === pageId)
        if (!to) return
        for (const page of p.pages) {
          const hit = locate(page.children, id)
          if (hit) {
            const [n] = hit.list.splice(hit.index, 1)
            to.children.push(n!)
            return
          }
        }
      })
      set({ pageId, selectedId: id })
    },
    styleClipboard: null,
    copyStyle: (id) => {
      for (const page of get().project.pages) {
        const n = findNode(page.children, id)
        if (n) return set({ styleClipboard: structuredClone({ style: n.style, layout: n.layout }) })
      }
    },
    pasteStyle: (id) => {
      const clip = get().styleClipboard
      if (clip) get().updateNode(id, (n) => void ((n.style = structuredClone(clip.style)), (n.layout = structuredClone(clip.layout))))
    },
    picker: null,
    openPicker: (picker) => set({ picker }),
    addPage: () => {
      const id = newId('page')
      get().update((p) => {
        const n = p.pages.length + 1
        p.pages.push({ id, path: `/pagina-${n}`, title: `Página ${n}`, icon: 'LayoutDashboard', state: {}, children: [] })
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
      const n = findNode(page.children, s.selectedId)
      if (n) return n
    }
    return undefined
  })
}
