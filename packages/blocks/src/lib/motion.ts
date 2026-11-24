export type MotionLevel = 'none' | 'subtle' | 'normal' | 'playful'

/** Read from <html data-motion="...">, set by the theme. */
export function motionLevel(): MotionLevel {
  if (typeof document === 'undefined') return 'normal'
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'none'
  const v = document.documentElement.dataset.motion
  return v === 'none' || v === 'subtle' || v === 'playful' ? v : 'normal'
}

export const motionPresets = {
  none: { y: 0, scale: 1, blur: 0, duration: 0, stagger: 0 },
  subtle: { y: 6, scale: 1, blur: 0, duration: 0.3, stagger: 0.03 },
  normal: { y: 12, scale: 1, blur: 4, duration: 0.45, stagger: 0.06 },
  playful: { y: 24, scale: 0.94, blur: 6, duration: 0.6, stagger: 0.09 },
} as const
