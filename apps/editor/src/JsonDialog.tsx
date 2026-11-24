import { AnimatePresence, motion } from 'motion/react'
import { Copy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, toast } from '@panelkit/blocks'
import { Project } from '@panelkit/schema'
import { fieldClass } from './lib/ui'
import { useEditor } from './store'

export function JsonDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { project, setProject } = useEditor()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    if (open) {
      setText(JSON.stringify(project, null, 2))
      setError('')
    }
  }, [open, project])

  function apply() {
    try {
      const parsed = Project.safeParse(JSON.parse(text))
      if (!parsed.success) {
        setError(parsed.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join(' · '))
        return
      }
      setProject(parsed.data)
      toast('Proyecto actualizado desde el JSON')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h2 className="font-semibold">Proyecto en JSON</h2>
                <p className="text-xs text-muted-foreground">Todo tu sistema vive en este archivo. Editalo, pegá uno nuevo o copialo.</p>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Cerrar"><X className="size-4" /></button>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} className={`${fieldClass} m-4 h-[55vh] w-auto resize-none py-3 font-mono text-[12px] leading-relaxed`} />
            <div className="flex items-center gap-2 border-t border-border px-5 py-3">
              <p className="flex-1 truncate text-xs text-rose-600">{error}</p>
              <Button variant="outline" onClick={() => { void navigator.clipboard.writeText(text); toast('JSON copiado', 'info') }}>
                <Copy className="size-4" /> Copiar
              </Button>
              <Button onClick={apply}>Aplicar cambios</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
