import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'

export type ImageProps = {
  src?: string
  alt?: string
  /** cover: fills the box and crops. contain: shows the whole image. */
  fit?: 'cover' | 'contain'
  /** Height in px; empty = natural height. */
  height?: number
  rounded?: boolean
  caption?: string
}

/** A picture from a URL (or a {{state.x}} / {{item.x}} value). */
export function Image({ src, alt = '', fit = 'cover', height, rounded = true, caption }: ImageProps) {
  const [failed, setFailed] = useState(false)
  const box = cn('w-full', rounded && 'rounded-[var(--radius)]')
  return (
    <figure className="grid gap-2">
      {src && !failed ? (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={cn(box, fit === 'cover' ? 'object-cover' : 'object-contain')} style={height ? { height } : undefined} />
      ) : (
        <div className={cn(box, 'grid place-items-center bg-muted text-muted-foreground')} style={{ height: height || 160 }}>
          <ImageOff className="size-6" />
        </div>
      )}
      {caption && <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>}
    </figure>
  )
}
