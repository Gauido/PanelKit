import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { motionLevel, motionPresets } from '../../lib/motion'

/** Fades and lifts its children in; `index` staggers siblings. Intensity follows the theme's motion level. */
export function Reveal({ children, index = 0, className, style }: { children: ReactNode; index?: number; className?: string; style?: CSSProperties }) {
  const level = motionLevel()
  const m = motionPresets[level]
  if (level === 'none') return <div className={className} style={style}>{children}</div>
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: m.y, scale: m.scale, filter: `blur(${m.blur}px)` }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={
        level === 'playful'
          ? { type: 'spring', stiffness: 260, damping: 20, delay: index * m.stagger }
          : { duration: m.duration, delay: index * m.stagger, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  )
}
