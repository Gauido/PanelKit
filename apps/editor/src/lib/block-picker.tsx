import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { cn } from '@panelkit/blocks'
import { registry, type BlockDef } from '@panelkit/exporter'
import { useEditor } from '../store'
import { Icon } from './icon'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** "Agregar bloque": search and pick with the keyboard or the mouse, no dragging needed. */
export function BlockPicker() {
  const target = useEditor((s) => s.picker)
  const openPicker = useEditor((s) => s.openPicker)
  const addNode = useEditor((s) => s.addNode)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const list = useMemo(
    () => Object.values(registry).filter((d) => !q || norm(`${d.label} ${d.description} ${d.category} ${d.type}`).includes(norm(q))),
    [q],
  )
  const groups = useMemo(() => list.reduce<Record<string, BlockDef[]>>((acc, d) => ((acc[d.category] ??= []).push(d), acc), {}), [list])
  const ordered = Object.values(groups).flat()

  useEffect(() => {
    if (target) {
      setQ('')
      setActive(0)
      requestAnimationFrame(() => input.current?.focus())
    }
  }, [target])
  useEffect(() => setActive(0), [q])

  const pick = (d: BlockDef | undefined) => {
    if (!d || !target) return
    addNode(d.type, target)
    openPicker(null)
  }
  const where = target?.parentId ? 'adentro del contenedor' : target?.beforeId ? 'antes del bloque elegido' : target?.afterId ? 'después del bloque elegido' : 'al final de la página'

  return (
    <AnimatePresence>
      {target && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-start justify-center bg-black/30 px-4 pt-[12vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onPointerDown={(e) => e.target === e.currentTarget && openPicker(null)}
        >
          <motion.div
            role="dialog"
            aria-label="Agregar bloque"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') (e.preventDefault(), setActive((i) => Math.min(ordered.length - 1, i + 1)))
                  else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((i) => Math.max(0, i - 1)))
                  else if (e.key === 'Enter') pick(ordered[active])
                  else if (e.key === 'Escape') openPicker(null)
                }}
                placeholder="¿Qué querés agregar? Tabla, botón, gráfico…"
                className="h-12 flex-1 bg-transparent text-sm outline-none"
              />
              <button onClick={() => openPicker(null)} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Cerrar">
                <X className="size-4" />
              </button>
            </div>
            <p className="px-4 pt-2 text-[11px] text-muted-foreground">Se agrega {where}. ↑ ↓ para elegir, Enter para agregar.</p>
            <div className="grid gap-3 overflow-y-auto p-3">
              {Object.entries(groups).map(([cat, defs]) => (
                <div key={cat}>
                  <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {defs.map((d) => {
                      const i = ordered.indexOf(d)
                      return (
                        <button
                          key={d.type}
                          onMouseEnter={() => setActive(i)}
                          onClick={() => pick(d)}
                          className={cn('flex items-start gap-3 rounded-lg p-2 text-left transition-colors', i === active ? 'bg-primary/10' : 'hover:bg-muted')}
                        >
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Icon name={d.icon} className="size-4" />
                          </span>
                          <span>
                            <span className="block text-[13px] font-medium">{d.label}</span>
                            <span className="block text-[11px] leading-snug text-muted-foreground">{d.description}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {ordered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Ningún bloque coincide con “{q}”.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
