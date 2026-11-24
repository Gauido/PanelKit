import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Copy, GripVertical, Minus, Plus, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@panelkit/blocks'
import { registry, spanClass, styleClass } from '@panelkit/exporter'
import type { Node } from '@panelkit/schema'
import { useCurrentPage, useEditor } from './store'
import { BlockView } from './lib/render'

function SortableBlock({ node }: { node: Node }) {
  const selected = useEditor((s) => s.selectedId === node.id)
  const { select, updateNode, removeNode, duplicateNode, selectPage, project } = useEditor()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id, data: { kind: 'node' } })
  const def = registry[node.type]
  const span = node.layout.span

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(spanClass(span), 'group relative', isDragging && 'z-10 opacity-60')}
      onClickCapture={(e) => {
        if (!selected) {
          e.stopPropagation()
          e.preventDefault()
        }
        select(node.id)
      }}
    >
      <div
        className={cn(
          'relative rounded-[calc(var(--radius)+4px)] p-1 outline-2 outline-offset-2 transition-[outline-color] duration-150',
          selected ? 'outline outline-primary' : 'outline outline-transparent hover:outline-primary/30',
        )}
      >
        <div className={styleClass(node.style)}>
          <BlockView
            node={node}
            live={selected}
            onNavigate={(to) => {
              const page = project.pages.find((p) => p.path === to)
              if (page) selectPage(page.id)
            }}
          />
        </div>
      </div>
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
        <button className="rounded-md p-1 hover:bg-muted" onClick={() => updateNode(node.id, (n) => void (n.layout.span = Math.max(1, span - 1)))} aria-label="Más angosto">
          <Minus className="size-3.5" />
        </button>
        <span className="w-9 text-center tabular-nums text-muted-foreground">{span}/12</span>
        <button className="rounded-md p-1 hover:bg-muted" onClick={() => updateNode(node.id, (n) => void (n.layout.span = Math.min(12, span + 1)))} aria-label="Más ancho">
          <Plus className="size-3.5" />
        </button>
        <span className="mx-1 h-4 w-px bg-border" />
        <button className="rounded-md p-1 hover:bg-muted" onClick={() => duplicateNode(node.id)} aria-label="Duplicar">
          <Copy className="size-3.5" />
        </button>
        <button className="rounded-md p-1 text-rose-600 hover:bg-rose-500/10" onClick={() => removeNode(node.id)} aria-label="Eliminar">
          <Trash2 className="size-3.5" />
        </button>
      </motion.div>
    </div>
  )
}

export function Canvas() {
  const page = useCurrentPage()
  const select = useEditor((s) => s.select)
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas', data: { kind: 'canvas' } })

  return (
    <div className="editor-dots min-h-0 flex-1 overflow-auto" onClick={() => select(null)}>
      <div className="mx-auto max-w-6xl p-6 pt-12 md:p-10 md:pt-14">
        <div
          ref={setNodeRef}
          className={cn(
            'grid min-h-[60vh] grid-cols-12 content-start gap-x-4 gap-y-10 rounded-2xl p-2 transition-colors',
            isOver && 'bg-primary/5 ring-2 ring-dashed ring-primary/40',
          )}
        >
          <SortableContext items={page.children.map((n) => n.id)} strategy={rectSortingStrategy}>
            {page.children.map((n) => (
              <SortableBlock key={n.id} node={n} />
            ))}
          </SortableContext>
          {page.children.length === 0 && (
            <div className="col-span-12 grid place-items-center rounded-2xl border-2 border-dashed border-border py-24 text-center">
              <div>
                <p className="font-medium">Arrastrá un bloque acá</p>
                <p className="mt-1 text-sm text-muted-foreground">Tablas, KPIs, formularios y botones, desde el panel de la izquierda.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
