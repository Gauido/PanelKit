import { ChevronRight, Eye, EyeOff, Filter as FilterIcon } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@panelkit/blocks'
import { registry } from '@panelkit/exporter'
import type { Node } from '@panelkit/schema'
import { Icon } from '../lib/icon'
import { useContextMenu } from '../lib/context-menu'
import { useCurrentPage, useEditor } from '../store'

/** A short, human name for a block: its own name, its title or text, or the block type. */
export function nodeLabel(n: Node): string {
  const p = n.props as Record<string, unknown>
  const hint = [p.title, p.label, p.text].find((x) => typeof x === 'string' && x.trim()) as string | undefined
  // {{item.name}} reads better as «name».
  const pretty = hint?.replace(/\{\{\s*(?:item|state|row|values)\.([\w.]+)\s*\}\}/g, '«$1»').replace(/\{\{\s*([\w.]+)\s*\}\}/g, '«$1»')
  return n.name || (pretty ? pretty.slice(0, 40) : (registry[n.type]?.label ?? n.type))
}

function reveal(id: string) {
  document.querySelector(`[data-node-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function Row({ node, depth }: { node: Node; depth: number }) {
  const [open, setOpen] = useState(true)
  const selected = useEditor((s) => s.selectedId === node.id)
  const device = useEditor((s) => s.device)
  const { select, toggleHidden } = useEditor()
  const openMenu = useContextMenu((m) => m.open)
  const def = registry[node.type]
  const kids = node.children ?? []
  const hidden = Boolean(node.layout.hide?.includes(device))
  return (
    <li>
      <div
        role="treeitem"
        aria-selected={selected}
        aria-expanded={kids.length ? open : undefined}
        onClick={() => {
          select(node.id)
          reveal(node.id)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          select(node.id)
          openMenu(e.clientX, e.clientY, node.id)
        }}
        className={cn(
          'group flex h-8 cursor-default items-center gap-1.5 rounded-md pr-1 text-[13px] transition-colors',
          selected ? 'bg-primary/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          hidden && 'opacity-50',
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        <button
          className={cn('grid size-4 place-items-center rounded transition-transform', !kids.length && 'invisible', open && 'rotate-90')}
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          aria-label={open ? 'Cerrar' : 'Abrir'}
        >
          <ChevronRight className="size-3.5" />
        </button>
        <Icon name={def?.icon ?? ''} className="size-3.5 shrink-0 text-primary" />
        <span className="flex-1 truncate">{nodeLabel(node)}</span>
        {node.visibleIf?.trim() && <FilterIcon className="size-3 shrink-0 text-amber-600" aria-label="Condicional" />}
        <button
          className={cn('grid size-6 place-items-center rounded hover:bg-background', hidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}
          onClick={(e) => {
            e.stopPropagation()
            toggleHidden(node.id, device)
          }}
          aria-label={hidden ? 'Mostrar en este dispositivo' : 'Ocultar en este dispositivo'}
          title={hidden ? 'Mostrar en este dispositivo' : 'Ocultar en este dispositivo'}
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      {open && kids.length > 0 && (
        <ul role="group">
          {kids.map((c) => (
            <Row key={c.id} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** The page as a tree: find, select and organize blocks, even nested or hidden ones. */
export function Layers() {
  const page = useCurrentPage()
  return (
    <div className="grid gap-3 p-3">
      <p className="px-1 text-xs text-muted-foreground">Toda la página como árbol. Clic para elegir, clic derecho para más acciones, Alt+↑/↓ para reordenar.</p>
      {page.children.length ? (
        <ul role="tree" aria-label="Capas" className="grid gap-px">
          {page.children.map((n) => (
            <Row key={n.id} node={n} depth={0} />
          ))}
        </ul>
      ) : (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">La página está vacía.</p>
      )}
    </div>
  )
}
