import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from './button'

type Request = { message: string; resolve: (ok: boolean) => void }

let current: Request | null = null
const listeners = new Set<(r: Request | null) => void>()
const emit = () => listeners.forEach((l) => l(current))

/** Asks the user to confirm. Resolves false when they cancel. Needs <ConfirmHost /> mounted once. */
export function confirm(message: string): Promise<boolean> {
  current?.resolve(false)
  return new Promise((resolve) => {
    current = { message, resolve }
    emit()
  })
}

export function ConfirmHost() {
  const [req, setReq] = useState<Request | null>(current)
  const okRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    listeners.add(setReq)
    return () => void listeners.delete(setReq)
  }, [])
  useEffect(() => {
    if (!req) return
    okRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [req])

  function close(ok: boolean) {
    current?.resolve(ok)
    current = null
    emit()
  }

  return (
    <AnimatePresence>
      {req && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => close(false)}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={req.message}
            className="w-full max-w-sm rounded-[var(--radius)] border border-border bg-card p-6 shadow-2xl"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="grid size-10 place-items-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-5" />
            </span>
            <p className="mt-4 font-medium">{req.message}</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => close(false)}>Cancelar</Button>
              <Button ref={okRef} onClick={() => close(true)}>Confirmar</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
