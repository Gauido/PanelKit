import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Device } from '@panelkit/exporter'
import { cn } from '@panelkit/blocks'

/** Width each device is designed at. Blocks use container queries, so this is exactly what users get. */
export const deviceWidth: Record<Device, number> = { desktop: 1200, tablet: 820, mobile: 390 }

/**
 * Renders children at the device's real width and zooms it down when the window is narrower,
 * so "desktop" looks like desktop even on a laptop with both side panels open.
 */
export function DeviceFrame({ device, children, className }: { device: Device; children: ReactNode; className?: string }) {
  const outer = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState(1200)
  useEffect(() => {
    const el = outer.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setAvailable(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const width = deviceWidth[device]
  const zoom = Math.min(1, available / width)
  return (
    <div ref={outer} className="w-full">
      <div
        className={cn('mx-auto transition-[width] duration-300', device !== 'desktop' && 'rounded-[28px] border-8 border-foreground/10 bg-background shadow-xl', className)}
        style={{ width, zoom }}
      >
        {children}
      </div>
    </div>
  )
}
