import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

export type ModalProps = {
  title?: string
  description?: string
  open: boolean
  onClose: () => void
  /** "modal" opens centered; "drawer" slides in from the right. */
  kind?: 'modal' | 'drawer'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children?: ReactNode
}

const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

/** A dialog or side panel that holds any blocks. Opened with the "Abrir modal" action. */
export function Modal({ title, description, open, onClose, kind = 'modal', size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const drawer = kind === 'drawer'
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn('fixed inset-0 z-40 flex bg-black/40 backdrop-blur-sm', drawer ? 'justify-end' : 'items-center justify-center p-4')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'flex max-h-full w-full flex-col overflow-hidden border border-border bg-background shadow-2xl',
              widths[size],
              drawer ? 'h-full rounded-l-[var(--radius)]' : 'max-h-[90dvh] rounded-[var(--radius)]',
            )}
            initial={drawer ? { x: '100%' } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={drawer ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={drawer ? { x: '100%' } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          >
            <div className="flex items-start gap-3 border-b border-border px-6 py-4">
              <div className="min-w-0 flex-1">
                {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cerrar">
                <X className="size-4" />
              </button>
            </div>
            <div className="@container grid grid-cols-12 gap-4 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
