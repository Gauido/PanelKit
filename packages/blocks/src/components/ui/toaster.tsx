import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'success' | 'error' | 'info'
type Item = { id: number; message: string; tone: Tone }

let items: Item[] = []
let nextId = 1
const listeners = new Set<(list: Item[]) => void>()
const emit = () => listeners.forEach((l) => l(items))

export function toast(message: string, tone: Tone = 'success') {
  const id = nextId++
  items = [...items, { id, message, tone }]
  emit()
  setTimeout(() => {
    items = items.filter((t) => t.id !== id)
    emit()
  }, 3200)
}

const icons = { success: CheckCircle2, error: XCircle, info: Info }

export function Toaster() {
  const [list, setList] = useState<Item[]>(items)
  useEffect(() => {
    listeners.add(setList)
    return () => void listeners.delete(setList)
  }, [])
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 grid gap-2">
      <AnimatePresence>
        {list.map((t) => {
          const Icon = icons[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex min-w-64 items-center gap-2.5 rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm shadow-lg"
            >
              <Icon className={cn('size-4', t.tone === 'success' && 'text-emerald-500', t.tone === 'error' && 'text-rose-500', t.tone === 'info' && 'text-primary')} />
              {t.message}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
