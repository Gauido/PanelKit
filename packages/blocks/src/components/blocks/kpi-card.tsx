import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Activity, Briefcase, DollarSign, ShoppingCart, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { getPath, toRows } from '../../lib/utils'
import { motionLevel } from '../../lib/motion'

const icons = { Users, DollarSign, TrendingUp, Activity, ShoppingCart, Briefcase }
export type KpiIcon = keyof typeof icons

export type KpiCardProps = {
  title: string
  /** Rows from a query; combined with `aggregate` and `field`. */
  data?: unknown
  aggregate?: 'count' | 'sum' | 'avg' | 'static'
  field?: string
  /** Used when aggregate is "static". */
  value?: number
  prefix?: string
  suffix?: string
  delta?: number
  icon?: KpiIcon
  loading?: boolean
}

function compute({ data, aggregate = 'count', field, value }: KpiCardProps): number {
  if (aggregate === 'static') return value ?? 0
  const rows = toRows(data)
  if (aggregate === 'count') return rows.length
  const nums = rows.map((r) => Number(getPath(r, field ?? ''))).filter((n) => Number.isFinite(n))
  const sum = nums.reduce((a, b) => a + b, 0)
  return aggregate === 'sum' ? sum : nums.length ? sum / nums.length : 0
}

export function KpiCard(props: KpiCardProps) {
  const { title, prefix = '', suffix = '', delta, icon = 'Activity', loading } = props
  const target = useMemo(() => compute(props), [props])
  const count = useMotionValue(0)
  const shown = useTransform(count, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)
  const Icon = icons[icon] ?? Activity

  useEffect(() => {
    const level = motionLevel()
    const duration = level === 'none' ? 0 : level === 'subtle' ? 0.6 : level === 'playful' ? 1.8 : 1.2
    const controls = animate(count, target, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [count, target])

  return (
    <Card className="group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60" />
      <div className="flex items-start justify-between">
        <p className="min-w-0 truncate pr-2 text-sm font-medium text-muted-foreground">{title}</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-[calc(var(--radius)-4px)] bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : (
        <motion.p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{shown}</motion.p>
      )}
      {delta !== undefined && (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
          {delta >= 0 ? '+' : ''}
          {delta}% vs. mes anterior
        </p>
      )}
    </Card>
  )
}
