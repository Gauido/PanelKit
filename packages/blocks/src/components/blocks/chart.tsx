import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { getPath, toRows } from '../../lib/utils'
import { motionLevel } from '../../lib/motion'
import { splitDateTime } from '../../lib/dates'

export type ChartProps = {
  title?: string
  /** Rows from a query. */
  data?: unknown
  chartType?: 'bar' | 'line' | 'area' | 'donut'
  /** Field that names each group (x axis / slice). */
  labelField?: string
  /** Numeric field combined with `aggregate`. Not needed for "count". */
  valueField?: string
  aggregate?: 'count' | 'sum' | 'avg'
  /** Groups dates in `labelField` by day or month. */
  dateGroup?: 'none' | 'day' | 'month'
  height?: number
  loading?: boolean
}

const palette = ['var(--color-primary)', 'oklch(0.7 0.15 230)', 'oklch(0.72 0.15 160)', 'oklch(0.78 0.15 75)', 'oklch(0.66 0.2 15)', 'oklch(0.6 0.18 300)']

type Point = { label: string; value: number }

function bucket(raw: unknown, mode: ChartProps['dateGroup']): string {
  const text = String(raw ?? '—')
  if (!mode || mode === 'none') return text
  const { date } = splitDateTime(text)
  if (!date) return text
  return mode === 'month' ? date.slice(0, 7) : date
}

function prettyLabel(label: string, mode: ChartProps['dateGroup']) {
  if (mode === 'month' && /^\d{4}-\d{2}$/.test(label)) return new Date(label + '-01T12:00').toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  if (mode === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(label)) return new Date(label + 'T12:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return label
}

export function groupRows({ data, labelField = '', valueField = '', aggregate = 'count', dateGroup = 'none' }: ChartProps): Point[] {
  const groups = new Map<string, number[]>()
  for (const row of toRows(data)) {
    const key = bucket(getPath(row, labelField), dateGroup)
    const n = aggregate === 'count' ? 1 : Number(getPath(row, valueField))
    if (!Number.isFinite(n)) continue
    groups.set(key, [...(groups.get(key) ?? []), n])
  }
  const out = [...groups.entries()].map(([label, nums]) => {
    const sum = nums.reduce((a, b) => a + b, 0)
    return { label, value: aggregate === 'avg' ? sum / nums.length : sum }
  })
  if (dateGroup !== 'none') out.sort((a, b) => a.label.localeCompare(b.label))
  return out
}

const fmt = (n: number) => (Math.abs(n) >= 1000 ? Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n) : Math.round(n * 10) / 10 + '')

export function Chart(props: ChartProps) {
  const { title, chartType = 'bar', height = 240, loading, dateGroup } = props
  const points = useMemo(() => groupRows(props), [props])
  const [hover, setHover] = useState<number | null>(null)
  const dur = motionLevel() === 'none' ? 0 : motionLevel() === 'playful' ? 1.1 : 0.7
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(200, Math.round(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
        {hover !== null && points[hover] && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {prettyLabel(points[hover].label, dateGroup)}: <b className="text-foreground">{fmt(points[hover].value)}</b>
          </span>
        )}
      </div>
      <div ref={box} className="mt-4" style={{ height }}>
        {loading ? (
          <Skeleton className="size-full" />
        ) : points.length === 0 ? (
          <p className="grid size-full place-items-center text-sm text-muted-foreground">Sin datos para graficar</p>
        ) : chartType === 'donut' ? (
          <Donut points={points} dur={dur} hover={hover} setHover={setHover} dateGroup={dateGroup} />
        ) : (
          <Cartesian W={width} H={height} points={points} type={chartType} dur={dur} hover={hover} setHover={setHover} dateGroup={dateGroup} />
        )}
      </div>
    </Card>
  )
}

type Inner = { points: Point[]; dur: number; hover: number | null; setHover: (i: number | null) => void; dateGroup: ChartProps['dateGroup'] }

function Cartesian({ W, H, points, type, dur, hover, setHover, dateGroup }: Inner & { W: number; H: number; type: 'bar' | 'line' | 'area' }) {
  const padL = 36, padB = 24, padT = 8
  const max = Math.max(...points.map((p) => p.value), 0) || 1
  const step = (W - padL) / points.length
  const x = (i: number) => padL + step * i + step / 2
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max)
  const ticks = [0, 0.5, 1].map((t) => max * t)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(W / 72))))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full overflow-visible" onMouseLeave={() => setHover(null)}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray="3 4" />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{fmt(t)}</text>
        </g>
      ))}
      {type === 'bar' &&
        points.map((p, i) => {
          const w = Math.min(step * 0.62, 48)
          return (
            <motion.rect
              key={p.label}
              x={x(i) - w / 2}
              width={w}
              rx={Math.min(6, w / 3)}
              fill="var(--color-primary)"
              opacity={hover === null || hover === i ? 1 : 0.45}
              initial={{ y: y(0), height: 0 }}
              animate={{ y: y(p.value), height: y(0) - y(p.value) }}
              transition={{ duration: dur, delay: dur ? i * 0.04 : 0, ease: [0.16, 1, 0.3, 1] }}
            />
          )
        })}
      {type === 'area' && <motion.path d={area} fill="var(--color-primary)" initial={{ opacity: 0 }} animate={{ opacity: 0.14 }} transition={{ duration: dur }} />}
      {type !== 'bar' && (
        <motion.path d={line} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: dur * 1.4, ease: 'easeInOut' }} />
      )}
      {type !== 'bar' && hover !== null && points[hover] && (
        <circle cx={x(hover)} cy={y(points[hover].value)} r={4.5} fill="var(--color-card)" stroke="var(--color-primary)" strokeWidth={2.5} />
      )}
      {points.map((p, i) => (
        <g key={p.label}>
          {i % every === 0 && (
            <text x={x(i)} y={H - 4} textAnchor="middle" className="fill-muted-foreground text-[11px]">{prettyLabel(p.label, dateGroup).slice(0, 12)}</text>
          )}
          <rect x={x(i) - step / 2} y={0} width={step} height={H - padB} fill="transparent" onMouseEnter={() => setHover(i)} />
        </g>
      ))}
    </svg>
  )
}

function Donut({ points, dur, hover, setHover, dateGroup }: Inner) {
  const total = points.reduce((a, p) => a + p.value, 0) || 1
  const R = 70, C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="flex size-full items-center gap-6">
      <svg viewBox="0 0 200 200" className="h-full max-h-56 shrink-0" onMouseLeave={() => setHover(null)}>
        <g transform="rotate(-90 100 100)">
          {points.map((p, i) => {
            const len = (p.value / total) * C
            const el = (
              <motion.circle
                key={p.label}
                cx={100} cy={100} r={R} fill="none"
                stroke={palette[i % palette.length]}
                strokeWidth={hover === i ? 30 : 24}
                strokeDashoffset={-offset}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${Math.max(len - 2, 0)} ${C}` }}
                transition={{ duration: dur, delay: dur ? i * 0.08 : 0, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHover(i)}
                className="cursor-pointer transition-[stroke-width]"
              />
            )
            offset += len
            return el
          })}
        </g>
        <text x={100} y={98} textAnchor="middle" className="fill-foreground text-[26px] font-semibold">{fmt(hover !== null && points[hover] ? points[hover].value : total)}</text>
        <text x={100} y={120} textAnchor="middle" className="fill-muted-foreground text-[11px]">{hover !== null && points[hover] ? prettyLabel(points[hover].label, dateGroup) : 'Total'}</text>
      </svg>
      <ul className="grid min-w-0 gap-1.5 text-sm">
        {points.slice(0, 8).map((p, i) => (
          <li key={p.label} className="flex min-w-0 items-center gap-2" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
            <span className="truncate">{prettyLabel(p.label, dateGroup)}</span>
            <span className="ml-auto pl-2 tabular-nums text-muted-foreground">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
