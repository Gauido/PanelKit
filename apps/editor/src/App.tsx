import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { Braces, Download, Eye, FileUp, PenLine, Redo2, RotateCcw, Undo2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button, cn, toast } from '@panelkit/blocks'
import { generate, kebab, registry, toZip } from '@panelkit/exporter'
import { Project } from '@panelkit/schema'
import { Canvas } from './Canvas'
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
  { id: 'theme', label: 'Tema' },
] as const

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function useThemeOnDocument() {
  const theme = useEditor((s) => s.project.theme)
  useEffect(() => {
    const root = document.documentElement
    root.dataset.accent = theme.accent
    root.style.setProperty('--radius', `${theme.radius}px`)
    const dark = theme.mode === 'dark' || (theme.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', dark)
  }, [theme])
}

function TopBar({ onJson }: { onJson: () => void }) {
  const { project, preview, setPreview, undo, redo, past, future, setProject, reset } = useEditor()
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
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-sm font-bold text-primary-foreground shadow-sm">P</span>
        <span className="font-semibold tracking-tight">PanelKit</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">alpha</span>
      </div>
      <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
      <span className="hidden truncate text-sm text-muted-foreground sm:block">{project.name}</span>
      <div className="ml-auto flex items-center gap-1">
        {!preview && (
          <>
            <IconButton onClick={undo} disabled={!past.length} aria-label="Deshacer" title="Deshacer"><Undo2 className="size-4" /></IconButton>
            <IconButton onClick={redo} disabled={!future.length} aria-label="Rehacer" title="Rehacer"><Redo2 className="size-4" /></IconButton>
            <IconButton onClick={() => { if (confirm('¿Volver a la plantilla CRM? Se pierden los cambios.')) reset() }} aria-label="Reiniciar" title="Volver a la plantilla"><RotateCcw className="size-4" /></IconButton>
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

export function App() {
  useThemeOnDocument()
  const { preview, addNode, moveNode } = useEditor()
  const page = useCurrentPage()
  const [tab, setTab] = useState<(typeof leftTabs)[number]['id']>('blocks')
  const [json, setJson] = useState(false)
  const [dragType, setDragType] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod || (e.target as HTMLElement).closest('input, textarea, select')) return
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useEditor.getState().redo()
        else useEditor.getState().undo()
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
              <Canvas />
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
    </div>
  )
}
