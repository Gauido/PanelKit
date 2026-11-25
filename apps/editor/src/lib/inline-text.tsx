import { useEffect, useRef } from 'react'
import { cn } from '@panelkit/blocks'
import { useEditor } from '../store'

/**
 * Text you edit right on the canvas: click the selected block's text and type.
 * Enter saves (Shift+Enter for a new line where allowed), Esc cancels.
 */
export function InlineText({ nodeId, prop, value, className, multiline, as: Tag = 'span', placeholder }: {
  nodeId: string
  prop: string
  value: string
  className?: string
  multiline?: boolean
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  placeholder?: string
}) {
  const ref = useRef<HTMLElement>(null)
  const updateNode = useEditor((s) => s.updateNode)
  // Keep the DOM in sync when the value changes elsewhere (inspector, undo), unless the user is typing here.
  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerText !== value) el.innerText = value
  }, [value])
  const commit = () => {
    const el = ref.current
    if (!el) return
    const next = multiline ? el.innerText.replace(/\n$/, '') : el.innerText.replace(/\n/g, ' ')
    if (next !== value) updateNode(nodeId, (n) => void ((n.props as Record<string, unknown>)[prop] = next))
  }
  return (
    <Tag
      ref={ref as never}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      title="Escribí para cambiar el texto"
      className={cn('cursor-text rounded-sm outline-none focus:bg-primary/5 focus:ring-2 focus:ring-primary/40 empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]', className)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          if (ref.current) ref.current.innerText = value
          ref.current?.blur()
        } else if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
          if (multiline && e.shiftKey) return
          e.preventDefault()
          ref.current?.blur()
        }
      }}
      onBlur={commit}
      onPointerDown={(e) => e.stopPropagation()}
    />
  )
}
