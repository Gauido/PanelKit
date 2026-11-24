import { useDraggable } from '@dnd-kit/core'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@panelkit/blocks'
import { registry, type BlockDef } from '@panelkit/exporter'
import { Icon } from '../lib/icon'
import { useEditor, useSelectedNode } from '../store'

function PaletteItem({ def }: { def: BlockDef }) {
  const addNode = useEditor((s) => s.addNode)
  const selected = useSelectedNode()
  // Double click adds inside the selected container, or at the end of the page.
  const parentId = selected && registry[selected.type]?.container ? selected.id : undefined
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${def.type}`, data: { kind: 'palette', type: def.type } })
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={() => addNode(def.type, { parentId })}
      className={cn(
        'group flex w-full cursor-grab items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
        <Icon name={def.icon} className="size-4" />
      </span>
      <span>
        <span className="block text-[13px] font-medium">{def.label}</span>
        <span className="block text-[11px] leading-snug text-muted-foreground">{def.description}</span>
      </span>
    </button>
  )
}

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function Palette() {
  const [q, setQ] = useState('')
  const groups = Object.values(registry)
    .filter((d) => !q || norm(`${d.label} ${d.description} ${d.category} ${d.type}`).includes(norm(q)))
    .reduce<Record<string, BlockDef[]>>((acc, d) => {
    ;(acc[d.category] ??= []).push(d)
    return acc
  }, {})
  return (
    <div className="grid gap-5 p-4">
      <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 focus-within:border-primary/50">
        <Search className="size-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar bloque…" className="w-full bg-transparent text-[13px] outline-none" />
      </label>
      <p className="text-xs text-muted-foreground">Arrastralo a donde quieras: antes, después o adentro de otro bloque. Doble clic lo agrega al final, o adentro del contenedor elegido.</p>
      {Object.entries(groups).map(([cat, defs]) => (
        <div key={cat} className="grid gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h4>
          {defs.map((d) => (
            <PaletteItem key={d.type} def={d} />
          ))}
        </div>
      ))}
      {Object.keys(groups).length === 0 && <p className="text-center text-xs text-muted-foreground">Ningún bloque coincide con “{q}”.</p>}
      <p className="rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
        Contenedores: soltá bloques adentro de una Sección, Pestañas o Modal. Para abrir un modal usá la acción “Abrir modal”. Próximamente: kanban, login y roles.
      </p>
    </div>
  )
}
