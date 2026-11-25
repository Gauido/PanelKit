import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { motion } from 'motion/react'
import {
  ArrowDown, ArrowUp, FileInput, Paintbrush, PaintRoller, ClipboardPaste, Copy, CopyPlus, Eye, EyeOff, Monitor, PanelTop, Pencil, Plus, Smartphone, SquareDashed, Tablet, Trash2, Ungroup,
} from 'lucide-react'
import { cn } from '@panelkit/blocks'
import { registry, spansFor, type Device } from '@panelkit/exporter'
import { useEditor, useSelectedNode } from '../store'

/** Right-click menu. id = block under the pointer, null = empty canvas. */
export const useContextMenu = create<{ at: { x: number; y: number; id: string | null } | null; open: (x: number, y: number, id: string | null) => void; close: () => void }>((set) => ({
  at: null,
  open: (x, y, id) => set({ at: { x, y, id } }),
  close: () => set({ at: null }),
}))

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'
const deviceIcon: Record<Device, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone }
const deviceName: Record<Device, string> = { desktop: 'escritorio', tablet: 'tablet', mobile: 'celular' }
const widths = [
  { label: '¼', span: 3 },
  { label: '⅓', span: 4 },
  { label: '½', span: 6 },
  { label: '⅔', span: 8 },
  { label: 'Todo', span: 12 },
]

function Item({ icon: I, label, hint, onClick, danger, disabled }: { icon: typeof Monitor; label: string; hint?: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40',
        danger ? 'text-rose-600 hover:bg-rose-500/10' : 'hover:bg-muted',
      )}
    >
      <I className="size-3.5 shrink-0 opacity-70" />
      <span className="flex-1">{label}</span>
      {hint && <kbd className="font-sans text-[11px] text-muted-foreground">{hint}</kbd>}
    </button>
  )
}
const Sep = () => <div className="my-1 h-px bg-border" />
const Label = ({ children }: { children: ReactNode }) => <p className="px-2 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground">{children}</p>

export function ContextMenu() {
  const { at, close } = useContextMenu()
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const s = useEditor()
  const node = useSelectedNode()

  // Keep the menu on screen.
  useLayoutEffect(() => {
    if (!at || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    setPos({ x: Math.min(at.x, window.innerWidth - r.width - 8), y: Math.max(8, Math.min(at.y, window.innerHeight - r.height - 8)) })
  }, [at])

  useEffect(() => {
    if (!at) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('blur', close)
    window.addEventListener('wheel', close, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('blur', close)
      window.removeEventListener('wheel', close)
    }
  }, [at, close])

  if (!at) return null
  const run = (fn: () => void) => () => {
    fn()
    close()
  }
  const target = at.id && node?.id === at.id ? node : undefined
  const def = target && registry[target.type]
  const device = s.device
  const span = target ? spansFor(target.layout)[device] : 12
  const hidden = Boolean(target?.layout.hide?.includes(device))
  const DeviceIcon = deviceIcon[device]

  return (
    <motion.div
      ref={ref}
      role="menu"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      style={{ left: pos.x || at.x, top: pos.y || at.y }}
      className="fixed z-[100] max-h-[calc(100dvh-16px)] w-60 origin-top-left overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {target && def ? (
        <>
          <Label>{def.label}</Label>
          <Item icon={Pencil} label="Editar" hint="Doble clic" onClick={run(() => focusInspector())} />
          <Item icon={Plus} label="Agregar bloque antes" onClick={run(() => s.openPicker({ beforeId: target.id }))} />
          <Item icon={Plus} label="Agregar bloque después" onClick={run(() => s.openPicker({ afterId: target.id }))} />
          {def.container && <Item icon={Plus} label="Agregar bloque adentro" onClick={run(() => s.openPicker({ parentId: target.id }))} />}
          <Sep />
          <Item icon={Copy} label="Copiar" hint={`${mod}C`} onClick={run(() => s.copyNode(target.id))} />
          <Item icon={ClipboardPaste} label="Pegar después" hint={`${mod}V`} disabled={!s.clipboard} onClick={run(() => s.pasteNode({ afterId: target.id }))} />
          {def.container && <Item icon={ClipboardPaste} label="Pegar adentro" disabled={!s.clipboard} onClick={run(() => s.pasteNode({ parentId: target.id }))} />}
          <Item icon={CopyPlus} label="Duplicar" hint={`${mod}D`} onClick={run(() => s.duplicateNode(target.id))} />
          <Item icon={Paintbrush} label="Copiar estilo" onClick={run(() => s.copyStyle(target.id))} />
          <Item icon={PaintRoller} label="Pegar estilo" disabled={!s.styleClipboard} onClick={run(() => s.pasteStyle(target.id))} />
          <Sep />
          <Item icon={ArrowUp} label="Mover antes" hint="Alt+↑" onClick={run(() => s.nudgeNode(target.id, -1))} />
          <Item icon={ArrowDown} label="Mover después" hint="Alt+↓" onClick={run(() => s.nudgeNode(target.id, 1))} />
          <Item icon={PanelTop} label="Meter en una sección" onClick={run(() => s.wrapInSection(target.id))} />
          {s.project.pages.length > 1 && (
            <details className="group/pages">
              <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] hover:bg-muted">
                <FileInput className="size-3.5 opacity-70" />
                <span className="flex-1">Mover a otra página</span>
                <span className="text-muted-foreground transition-transform group-open/pages:rotate-90">›</span>
              </summary>
              <div className="ml-6 grid">
                {s.project.pages
                  .filter((p) => p.id !== s.pageId)
                  .map((p) => (
                    <button key={p.id} onClick={run(() => s.moveToPage(target.id, p.id))} className="rounded-md px-2 py-1 text-left text-[13px] hover:bg-muted">
                      {p.title}
                    </button>
                  ))}
              </div>
            </details>
          )}
          {def.container && <Item icon={Ungroup} label="Sacar los bloques de adentro" disabled={!target.children?.length} onClick={run(() => s.unwrapNode(target.id))} />}
          <Sep />
          <Label>
            <span className="inline-flex items-center gap-1">
              <DeviceIcon className="size-3" /> Ancho en {deviceName[device]}
            </span>
          </Label>
          <div className="flex gap-1 px-1.5 pb-1">
            {widths.map((w) => (
              <button
                key={w.span}
                onClick={run(() => s.setSpanFor(target.id, device, w.span))}
                className={cn('flex-1 rounded-md border py-1 text-xs transition-colors', span === w.span ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border hover:bg-muted')}
              >
                {w.label}
              </button>
            ))}
          </div>
          <Item icon={hidden ? Eye : EyeOff} label={hidden ? `Mostrar en ${deviceName[device]}` : `Ocultar en ${deviceName[device]}`} onClick={run(() => s.toggleHidden(target.id, device))} />
          <Sep />
          <Item icon={Trash2} label="Eliminar" hint="Supr" danger onClick={run(() => s.removeNode(target.id))} />
        </>
      ) : (
        <>
          <Label>Página</Label>
          <Item icon={Plus} label="Agregar bloque" hint="/" onClick={run(() => s.openPicker({}))} />
          <Item icon={ClipboardPaste} label="Pegar al final" hint={`${mod}V`} disabled={!s.clipboard} onClick={run(() => s.pasteNode())} />
          <Item icon={SquareDashed} label="Agregar sección vacía" onClick={run(() => s.addNode('Section'))} />
        </>
      )}
    </motion.div>
  )
}

/** Opens the block's settings and puts the cursor in its first field. */
export function focusInspector() {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[data-inspector] input:not([type=checkbox]):not([type=range]), [data-inspector] textarea')
      el?.focus()
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select()
    }),
  )
}
