import { useMemo } from 'react'
import { inputClass } from '../ui/input'
import { cn, getPath, toRows } from '../../lib/utils'

export type FilterProps = {
  label?: string
  inputType?: 'select' | 'text' | 'date' | 'number'
  /** Current value (from a page variable). */
  value?: unknown
  onChange?: (value: string) => void
  /** Fixed options, comma separated. */
  options?: string
  /** Options from a query: rows plus which field to show and which to use as value. */
  data?: unknown
  optionLabel?: string
  optionValue?: string
  /** First option meaning "no filter". Empty: no such option. */
  allLabel?: string
  placeholder?: string
}

/** An input that saves what the user picks into a page variable, so other blocks can use it. */
export function Filter({ label, inputType = 'select', value, onChange, options, data, optionLabel, optionValue, allLabel = 'Todos', placeholder }: FilterProps) {
  const items = useMemo(() => {
    const fixed = (options ?? '').split(',').map((o) => o.trim()).filter(Boolean).map((o) => ({ label: o, value: o }))
    const fromData = toRows(data).map((r) => {
      const v = String(getPath(r, optionValue || optionLabel || 'id') ?? '')
      return { label: String(getPath(r, optionLabel || optionValue || 'name') ?? v), value: v }
    })
    return [...fixed, ...fromData]
  }, [options, data, optionLabel, optionValue])
  const v = value === undefined || value === null ? '' : String(value)

  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      {label && <span className="font-medium">{label}</span>}
      {inputType === 'select' ? (
        <select className={inputClass} value={v} onChange={(e) => onChange?.(e.target.value)}>
          {allLabel && <option value="">{allLabel}</option>}
          {items.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          className={cn(inputClass, 'min-w-0')}
          type={inputType === 'text' ? 'search' : inputType}
          value={v}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )}
    </label>
  )
}
