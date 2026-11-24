import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Braces, ChevronLeft, Download, Eye, FileUp, Keyboard, PenLine, Redo2, RotateCcw, Undo2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button, cn, toast } from '@panelkit/blocks'
import { generate, kebab, registry, toZip } from '@panelkit/exporter'
import { Project } from '@panelkit/schema'
import { Canvas } from './Canvas'
import { Home } from './Home'
import { useLiveStyles } from './lib/live-styles'
import { JsonDialog } from './JsonDialog'
import { Preview } from './Preview'
import { Data } from './panels/Data'
import { Inspector } from './panels/Inspector'
import { Pages } from './panels/Pages'
import { Palette } from './panels/Palette'
import { Theme } from './panels/Theme'
import { Icon } from './lib/icon'
import { IconButton } from './lib/ui'
import { runtimeFiles } from './lib/runtime-files'
import { useCurrentPage, useEditor } from './store'

const leftTabs = [
  { id: 'blocks', label: 'Bloques' },
  { id: 'pages', label: 'Páginas' },
  { id: 'data', label: 'Datos' },
  { id: 'theme', label: 'Estilo' },
] as const

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function TopBar({ onJson }: { onJson: () => void }) {
  const { project, preview, setPreview, undo, redo, past, future, setProject, reset, closeProject } = useEditor()
  const fileRef = useRef<HTMLInputElement>(null)

  async function exportRepo() {
    const files = generate(project, runtimeFiles)
    const slug = kebab(project.name)
    download(await toZip(files, slug), `${slug}.zip`)
    toast(`Repo exportado: ${Object.keys(files).length} archivos`)
  }

  async function importJson(file: File) {
    try {
      const parsed = Project.parse(JSON.parse(await file.text()))
      setProject(parsed)
      toast('Proyecto importado')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Archivo inválido', 'error')
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      <button onClick={closeProject} className="group flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted" title="Volver a mis proyectos">
        <ChevronLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
        <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground shadow-sm">P</span>
      </button>
      <span className="truncate text-sm font-medium">{project.name}</span>
      <div className="ml-auto flex items-center gap-1">
        {!preview && (
          <>
            <IconButton onClick={undo} disabled={!past.length} aria-label="Deshacer" title="Deshacer"><Undo2 className="size-4" /></IconButton>
            <IconButton onClick={redo} disabled={!future.length} aria-label="Rehacer" title="Rehacer"><Redo2 className="size-4" /></IconButton>
            <IconButton onClick={() => { if (confirm('¿Volver a la plantilla original? Se pierden los cambios.')) reset() }} aria-label="Reiniciar" title="Volver a la plantilla"><RotateCcw className="size-4" /></IconButton>
            <span className="mx-1 h-6 w-px bg-border" />
            <IconButton onClick={onJson} aria-label="Ver JSON" title="Ver y editar el JSON"><Braces className="size-4" /></IconButton>
            <IconButton onClick={() => fileRef.current?.click()} aria-label="Importar JSON" title="Importar panelkit.json"><FileUp className="size-4" /></IconButton>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </>
        )}
        <div className="ml-2 flex rounded-lg bg-muted p-0.5 text-[13px]">
          {[
            { on: false, label: 'Diseñar', icon: PenLine },
            { on: true, label: 'Probar', icon: Eye },
          ].map((m) => (
            <button key={m.label} onClick={() => setPreview(m.on)} className={cn('relative flex items-center gap-1.5 rounded-md px-3 py-1', preview === m.on ? 'text-foreground' : 'text-muted-foreground')}>
              {preview === m.on && <motion.span layoutId="mode" className="absolute inset-0 rounded-md bg-card shadow-sm" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
              <m.icon className="relative size-3.5" />
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>
        <Button className="ml-2 h-8" onClick={exportRepo}>
          <Download className="size-4" /> Exportar repo
        </Button>
      </div>
    </header>
  )
}

const shortcuts: [string, string][] = [
  ['Ctrl Z / Ctrl Shift Z', 'Deshacer / rehacer'],
  ['Supr', 'Eliminar el bloque elegido'],
  ['Ctrl D', 'Duplicar el bloque elegido'],
  ['[ y ]', 'Achicar o agrandar el bloque'],
  ['Esc', 'Soltar la selección'],
  ['P', 'Pasar a modo Probar y volver'],
  ['?', 'Ver estos atajos'],
]

function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }} className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold"><Keyboard className="size-4" /> Atajos</h2>
          <IconButton onClick={onClose} aria-label="Cerrar"><X className="size-4" /></IconButton>
        </div>
        <dl className="grid gap-2 text-sm">
          {shortcuts.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{v}</dt>
              <dd><kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">{k}</kbd></dd>
            </div>
          ))}
        </dl>
      </motion.div>
    </motion.div>
  )
}

function FirstSteps() {
  const [hidden, setHidden] = useState(() => {
    try {
      return localStorage.getItem('panelkit:tips') === 'off'
    } catch {
      return false
    }
  })
  const steps = ['Arrastrá un bloque desde la izquierda', 'Hacé clic en él y cambiá sus datos a la derecha', 'Tocá Probar para usarlo como una app real', 'Exportá el repo cuando esté listo']
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.6, type: 'spring', stiffness: 260, damping: 22 } }}
          exit={{ opacity: 0, y: 20 }}
          className="pointer-events-auto absolute bottom-4 left-4 z-30 w-72 rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Primeros pasos</p>
            <IconButton
              aria-label="Ocultar"
              onClick={() => {
                setHidden(true)
                try {
                  localStorage.setItem('panelkit:tips', 'off')
                } catch {
                  /* ignore */
                }
              }}
            >
              <X className="size-3.5" />
            </IconButton>
          </div>
          <ol className="mt-2 grid gap-1.5">
            {steps.map((s, i) => (
              <motion.li key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.8 + i * 0.08 } }} className="flex items-start gap-2 text-[13px]">
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">{i + 1}</span>
                {s}
              </motion.li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] text-muted-foreground">Tocá <kbd className="rounded border border-border bg-muted px-1">?</kbd> para ver los atajos.</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function App() {
  const projectId = useEditor((s) => s.projectId)
  const project = useEditor((s) => s.project)
  useLiveStyles(projectId ? project : null)
  return (
    <AnimatePresence mode="wait">
      {projectId ? (
        <motion.div key={projectId} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          <Editor />
        </motion.div>
      ) : (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.25 }}>
          <Home />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Editor() {
  const { preview, addNode, moveNode } = useEditor()
  const [help, setHelp] = useState(false)
  const page = useCurrentPage()
  const [tab, setTab] = useState<(typeof leftTabs)[number]['id']>('blocks')
  const [json, setJson] = useState(false)
  const [dragType, setDragType] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable]')) return
      const s = useEditor.getState()
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      } else if (mod && key === 'd' && s.selectedId) {
        e.preventDefault()
        s.duplicateNode(s.selectedId)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.selectedId) {
        e.preventDefault()
        s.removeNode(s.selectedId)
      } else if ((e.key === '[' || e.key === ']') && s.selectedId) {
        s.updateNode(s.selectedId, (n) => void (n.layout.span = Math.min(12, Math.max(1, n.layout.span + (e.key === ']' ? 1 : -1)))))
      } else if (e.key === 'Escape') {
        s.select(null)
        setHelp(false)
      } else if (!mod && key === 'p') {
        s.setPreview(!s.preview)
      } else if (e.key === '?') {
        setHelp((h) => !h)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onDragStart(e: DragStartEvent) {
    const d = e.active.data.current
    if (d?.kind === 'palette') setDragType(d.type as string)
  }

  function onDragEnd(e: DragEndEvent) {
    setDragType(null)
    const { active, over } = e
    if (!over) return
    const ids = page.children.map((n) => n.id)
    const overIndex = ids.indexOf(String(over.id))
    if (active.data.current?.kind === 'palette') {
      addNode(active.data.current.type as string, overIndex >= 0 ? overIndex : undefined)
      return
    }
    const from = ids.indexOf(String(active.id))
    if (from >= 0 && overIndex >= 0 && from !== overIndex) moveNode(from, overIndex)
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <TopBar onJson={() => setJson(true)} />
      {preview ? (
        <Preview />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragType(null)}>
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/50">
              <nav className="flex gap-1 border-b border-border p-2">
                {leftTabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)} className={cn('relative flex-1 rounded-md py-1.5 text-[13px] transition-colors', tab === t.id ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {tab === t.id && <motion.span layoutId="left-tab" className="absolute inset-0 rounded-md bg-muted" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span className="relative">{t.label}</span>
                  </button>
                ))}
              </nav>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }} transition={{ duration: 0.15 }}>
                    {tab === 'blocks' && <Palette />}
                    {tab === 'pages' && <Pages />}
                    {tab === 'data' && <Data />}
                    {tab === 'theme' && <Theme />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </aside>
            <main className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b border-border bg-card/40 px-4 py-2 text-[13px]">
                <Icon name={page.icon} className="size-4 text-muted-foreground" />
                <span className="font-medium">{page.title}</span>
                <span className="text-muted-foreground">{page.path}</span>
                <span className="ml-auto text-xs text-muted-foreground">{page.children.length} bloques · clic para elegir, arrastrá desde la etiqueta para mover</span>
              </div>
              <div className="relative flex min-h-0 flex-1 flex-col">
                <Canvas />
                <FirstSteps />
              </div>
            </main>
            <aside className="w-80 shrink-0 overflow-y-auto border-l border-border bg-card/50">
              <Inspector />
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>
            {dragType && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/40 bg-card px-3 py-2 text-[13px] font-medium shadow-xl">
                <Icon name={registry[dragType]?.icon ?? ''} className="size-4 text-primary" />
                {registry[dragType]?.label}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
      <JsonDialog open={json} onClose={() => setJson(false)} />
      <AnimatePresence>{help && <Shortcuts onClose={() => setHelp(false)} />}</AnimatePresence>
    </div>
  )
}
