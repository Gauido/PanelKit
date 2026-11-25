import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Minus, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@panelkit/blocks'
import { layoutClass, registry, spansFor, styleClass, styleCss } from '@panelkit/exporter'
import type { Node } from '@panelkit/schema'
import { useCurrentPage, useEditor } from './store'
import { BlockView, type RenderChildren } from './lib/render'
import { PageStateProvider } from './lib/page-state'
import { DeviceFrame } from './lib/device-frame'
import { useDropHint } from './lib/drop-hint'
import { focusInspector, useContextMenu } from './lib/context-menu'

function SortableBlock({ node, mode = 'grid' }: { node: Node; mode?: 'grid' | 'list' | 'flex' }) {
  const inList = mode === 'list'
  const selected = useEditor((s) => s.selectedId === node.id)
  const { select, setSpanFor, removeNode, duplicateNode, selectPage, project, openPicker } = useEditor()
  const openMenu = useContextMenu((m) => m.open)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id, data: { kind: 'node', container: Boolean(registry[node.type]?.container) } })
  const def = registry[node.type]
  const device = useEditor((s) => s.device)
  // The +/- buttons change the width for the device being previewed.
  const span = spansFor(node.layout)[device]
  // Hidden on this device: still shown (faded) so it can be selected and edited.
  const hiddenHere = Boolean(node.layout.hide?.includes(device))
  const hint = useDropHint((h) => (h.id === node.id ? h.zone : null))
  const fullRow = inList || (mode === 'grid' && span === 12)
  const setSpan = (v: number) => setSpanFor(node.id, device, v)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-node-id={node.id}
      className={cn(mode === 'list' ? 'col-span-12' : mode === 'flex' ? 'min-w-12' : layoutClass({ ...node.layout, hide: undefined }), hiddenHere && 'opacity-35', 'group relative', isDragging && 'z-10 opacity-60')}
      onClickCapture={(e) => {
        // Let the innermost block under the pointer take the click.
        const owner = (e.target as HTMLElement).closest('[data-node-id]')
        if (owner && owner !== e.currentTarget) return
        if (!selected) {
          e.stopPropagation()
          e.preventDefault()
        }
        select(node.id)
      }}
      // A click inside a block never reaches the canvas, which would clear the selection.
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-node-id]') !== e.currentTarget) return
        select(node.id)
        focusInspector()
      }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest('[data-node-id]') !== e.currentTarget) return
        e.preventDefault()
        e.stopPropagation()
        select(node.id)
        openMenu(e.clientX, e.clientY, node.id)
      }}
    >
      <div
        className={cn(
          'relative rounded-[calc(var(--radius)+4px)] p-1 outline-2 outline-offset-2 transition-[outline-color] duration-150',
          selected ? 'outline outline-primary' : 'outline outline-transparent hover:outline-primary/30',
        )}
      >
        {node.roles?.length ? (
          <span className="pointer-events-none absolute -top-2.5 left-2 z-10 rounded-full border border-sky-500/40 bg-sky-50 px-1.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            Solo {node.roles.join(', ')}
          </span>
        ) : null}
        {node.visibleIf?.trim() && (
          <span className="pointer-events-none absolute -top-2.5 right-2 z-10 rounded-full border border-amber-500/40 bg-amber-50 px-1.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300" title={`Se muestra solo si: ${node.visibleIf}`}>
            Condicional
          </span>
        )}
        <div className={styleClass(node.style)} style={styleCss(node.style)}>
          <BlockView
            node={node}
            design
            renderChildren={renderChildren}
            live={selected}
            onNavigate={(to) => {
              const page = project.pages.find((p) => p.path === to)
              if (page) selectPage(page.id)
            }}
          />
        </div>
      </div>
      {hint && hint !== 'inside' && (
        // Where the dragged block will land: a line before or after this one.
        <span
          className={cn(
            'pointer-events-none absolute z-30 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]',
            fullRow ? 'inset-x-1 h-1' : 'inset-y-1 w-1',
            fullRow ? (hint === 'before' ? '-top-3' : '-bottom-3') : hint === 'before' ? '-left-2.5' : '-right-2.5',
          )}
        />
      )}
      {hint === 'inside' && <span className="pointer-events-none absolute inset-0 z-30 rounded-[calc(var(--radius)+6px)] bg-primary/5 ring-2 ring-primary" />}
      <motion.div
        initial={false}
        animate={{ opacity: selected ? 1 : 0, y: selected ? 0 : 4 }}
        className={cn('absolute -top-9 left-1 z-20 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 text-xs shadow-md', !selected && 'pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100')}
      >
        <button {...attributes} {...listeners} className="flex cursor-grab items-center gap-1 rounded-md px-1.5 py-1 font-medium active:cursor-grabbing" aria-label="Mover">
          <GripVertical className="size-3.5 text-muted-foreground" />
          {def?.label ?? node.type}
        </button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button className="rounded-md p-1 hover:bg-muted" onClick={() => setSpan(span - 1)} aria-label="Más angosto">
          <Minus className="size-3.5" />
        </button>
        <span className="w-9 text-center tabular-nums text-muted-foreground">{span}/12</span>
        <button className="rounded-md p-1 hover:bg-muted" onClick={() => setSpan(span + 1)} aria-label="Más ancho">
          <Plus className="size-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button className="rounded-md p-1 hover:bg-muted" onClick={() => duplicateNode(node.id)} aria-label="Duplicar">
          <Copy className="size-3.5" />
        </button>
        <button className="rounded-md p-1 text-rose-600 hover:bg-rose-500/10" onClick={() => removeNode(node.id)} aria-label="Eliminar">
          <Trash2 className="size-3.5" />
        </button>
        <button
          className="rounded-md p-1 hover:bg-muted"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            openMenu(r.left, r.bottom + 4, node.id)
          }}
          aria-label="Más acciones"
          title="Más acciones (o clic derecho sobre el bloque)"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </motion.div>
      {/* Quick add right after this block, without dragging. */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          openPicker({ afterId: node.id })
        }}
        className={cn(
          'absolute -bottom-7 left-1/2 z-20 grid size-6 -translate-x-1/2 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all hover:scale-110 hover:border-primary hover:text-primary',
          selected ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
        )}
        aria-label="Agregar bloque después"
        title="Agregar bloque después"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

/** Editable area inside a container: drop blocks here, reorder them, select them. */
function NestedArea({ parent, layout }: { parent: Node; layout: 'grid' | 'list' | 'flex' }) {
  const column = layout === 'flex' && parent.props.direction === 'column'
  const kids = parent.children ?? []
  const { setNodeRef, isOver } = useDroppable({ id: `drop:${parent.id}`, data: { kind: 'container', parentId: parent.id } })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-20 rounded-xl p-1 pt-8 transition-colors',
        layout === 'flex'
          ? cn(
              'flex gap-x-4 gap-y-10',
              column ? 'flex-col' : 'flex-wrap',
              { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' }[String(parent.props.align ?? 'center')],
              { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' }[String(parent.props.justify ?? 'start')],
            )
          : '@container grid grid-cols-12 content-start gap-x-4 gap-y-10',
        isOver && 'bg-primary/5 ring-2 ring-dashed ring-primary/40',
      )}
    >
      <SortableContext items={kids.map((n) => n.id)} strategy={rectSortingStrategy}>
        {kids.map((n) => (
          <SortableBlock key={n.id} node={n} mode={layout} />
        ))}
      </SortableContext>
      {kids.length === 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            useEditor.getState().openPicker({ parentId: parent.id })
          }}
          className="col-span-12 -mt-6 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-6 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Plus className="size-3.5" /> Agregar bloque o arrastrá uno acá {layout === 'list' ? '(cada uno es una pestaña)' : ''}
        </button>
      )}
    </div>
  )
}

const renderChildren: RenderChildren = (parent, layout) => <NestedArea parent={parent} layout={layout} />

export function Canvas() {
  const page = useCurrentPage()
  const select = useEditor((s) => s.select)
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas', data: { kind: 'canvas' } })
  const device = useEditor((s) => s.device)
  const openPicker = useEditor((s) => s.openPicker)
  const openMenu = useContextMenu((m) => m.open)

  return (
    <PageStateProvider key={page.id} initial={page.state ?? {}}>
    <div
      className="editor-dots min-h-0 flex-1 overflow-auto"
      onClick={() => select(null)}
      onContextMenu={(e) => {
        e.preventDefault()
        select(null)
        openMenu(e.clientX, e.clientY, null)
      }}
    >
      <div className="p-6 pt-12 md:p-10 md:pt-14">
        <DeviceFrame device={device}>
        <div
          ref={setNodeRef}
          className={cn(
            '@container grid min-h-[60vh] grid-cols-12 content-start gap-x-4 gap-y-10 rounded-2xl p-2 transition-colors',
            isOver && 'bg-primary/5 ring-2 ring-dashed ring-primary/40',
          )}
        >
          <SortableContext items={page.children.map((n) => n.id)} strategy={rectSortingStrategy}>
            {page.children.map((n) => (
              <SortableBlock key={n.id} node={n} />
            ))}
          </SortableContext>
          {page.children.length === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openPicker({})
              }}
              className="col-span-12 grid place-items-center rounded-2xl border-2 border-dashed border-border py-24 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <div>
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Plus className="size-5" />
                </span>
                <p className="mt-3 font-medium">Agregá tu primer bloque</p>
                <p className="mt-1 text-sm text-muted-foreground">Hacé clic acá, apretá / o arrastrá uno desde la izquierda.</p>
              </div>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openPicker({})
              }}
              className="col-span-12 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="size-4" /> Agregar bloque
              <kbd className="rounded border border-border px-1.5 font-sans text-[11px]">/</kbd>
            </button>
          )}
        </div>
        </DeviceFrame>
      </div>
    </div>
    </PageStateProvider>
  )
}
