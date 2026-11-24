import { useDraggable } from '@dnd-kit/core'
import { cn } from '@panelkit/blocks'
import { registry, type BlockDef } from '@panelkit/exporter'
import { Icon } from '../lib/icon'
import { useEditor } from '../store'

function PaletteItem({ def }: { def: BlockDef }) {
  const addNode = useEditor((s) => s.addNode)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `palette:${def.type}`, data: { kind: 'palette', type: def.type } })
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onDoubleClick={() => addNode(def.type)}
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

export function Palette() {
  const groups = Object.values(registry).reduce<Record<string, BlockDef[]>>((acc, d) => {
    ;(acc[d.category] ??= []).push(d)
    return acc
  }, {})
  return (
    <div className="grid gap-5 p-4">
      <p className="text-xs text-muted-foreground">Arrastrá un bloque al lienzo, o hacé doble clic para agregarlo al final.</p>
      {Object.entries(groups).map(([cat, defs]) => (
        <div key={cat} className="grid gap-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</h4>
          {defs.map((d) => (
            <PaletteItem key={d.type} def={d} />
          ))}
        </div>
      ))}
      <p className="rounded-lg bg-muted p-3 text-[11px] leading-relaxed text-muted-foreground">
        Próximamente: gráficos, calendario, kanban, tabs, modales y el resto del catálogo.
      </p>
    </div>
  )
}
