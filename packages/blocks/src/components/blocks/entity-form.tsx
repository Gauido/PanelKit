import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input, inputClass } from '../ui/input'
import { cn, getPath, toRows } from '../../lib/utils'

export type FormField = {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'time' | 'datetime-local' | 'tel' | 'url' | 'password' | 'textarea' | 'select' | 'checkbox' | 'image' | 'file'
  /** For "image" / "file": biggest size accepted, in MB (default 5). */
  maxSizeMb?: number
  required?: boolean
  /** Comma separated, for "select". */
  options?: string
  /** For "select": take the options from a query instead (its id), showing `optionLabel` and saving `optionValue`. */
  optionsQuery?: string
  optionLabel?: string
  optionValue?: string
  span?: 1 | 2
  placeholder?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  /** Regular expression the value must match. */
  pattern?: string
  /** Shown when any rule above fails. */
  message?: string
}

function rules(f: FormField) {
  return {
    required: f.required,
    minLength: f.minLength,
    maxLength: f.maxLength,
    min: f.min,
    max: f.max,
    pattern: f.pattern,
    placeholder: f.placeholder,
    onInvalid: f.message ? (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }) => e.currentTarget.setCustomValidity(f.message!) : undefined,
    onInput: f.message ? (e: { currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }) => e.currentTarget.setCustomValidity('') : undefined,
  }
}

export type EntityFormProps = {
  title?: string
  description?: string
  fields: FormField[]
  submitLabel?: string
  /** Pre-fills the form, e.g. with the row being edited. */
  initialValues?: Record<string, unknown> | null
  /** Rows of each query used by `optionsQuery`, keyed by query id. */
  optionData?: Record<string, unknown>
  /** Clear the fields after a successful submit (default: only when there are no initial values). */
  resetOnSubmit?: boolean
  onSubmit?: (values: Record<string, unknown>) => Promise<unknown> | void
}

function selectOptions(f: FormField, optionData: Record<string, unknown> | undefined) {
  const fixed = (f.options ?? '').split(',').map((o) => o.trim()).filter(Boolean).map((o) => ({ label: o, value: o }))
  if (!f.optionsQuery) return fixed
  const rows = toRows(optionData?.[f.optionsQuery])
  return [
    ...fixed,
    ...rows.map((r) => {
      const value = String(getPath(r, f.optionValue || f.optionLabel || 'id') ?? '')
      return { label: String(getPath(r, f.optionLabel || f.optionValue || 'name') ?? value), value }
    }),
  ]
}

export function EntityForm({ title, description, fields, submitLabel = 'Guardar', initialValues, optionData, resetOnSubmit, onSubmit }: EntityFormProps) {
  const initial = initialValues && typeof initialValues === 'object' ? initialValues : undefined
  const formKey = useMemo(() => JSON.stringify(initial ?? {}), [initial])
  const dv = (name: string) => {
    const v = initial?.[name]
    return v === undefined || v === null ? undefined : String(v)
  }
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const el = e.currentTarget
    const form = new FormData(el)
    const values: Record<string, unknown> = {}
    for (const f of fields) {
      const raw = form.get(f.name)
      values[f.name] = f.type === 'checkbox' ? raw === 'on' : f.type === 'number' && raw !== '' ? Number(raw) : raw
    }
    setStatus('saving')
    try {
      await onSubmit?.(values)
      setStatus('saved')
      if (resetOnSubmit ?? !initial) el.reset()
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <Card className="@container p-5">
      {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <form key={formKey} onSubmit={handleSubmit} className="mt-4 grid gap-4 @md:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={cn('grid min-w-0 gap-1.5 text-sm', (f.span === 2 || f.type === 'textarea' || f.type === 'image' || f.type === 'file') && '@md:col-span-2', f.type === 'checkbox' && 'flex items-center gap-2')}>
            {f.type !== 'checkbox' && (
              <span className="font-medium">
                {f.label}
                {f.required && <span className="text-primary"> *</span>}
              </span>
            )}
            {f.type === 'textarea' ? (
              <textarea name={f.name} defaultValue={dv(f.name)} required={f.required} minLength={f.minLength} maxLength={f.maxLength} placeholder={f.placeholder} onInvalid={rules(f).onInvalid} onInput={rules(f).onInput} rows={3} className={cn(inputClass, 'h-auto py-2')} />
            ) : f.type === 'select' ? (
              <select name={f.name} required={f.required} onInvalid={rules(f).onInvalid} onChange={rules(f).onInput} className={inputClass} defaultValue={dv(f.name) ?? ''}>
                <option value="" disabled>Elegir…</option>
                {selectOptions(f, optionData).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : f.type === 'checkbox' ? (
              <>
                <input type="checkbox" name={f.name} defaultChecked={Boolean(initial?.[f.name])} className="size-4 accent-[var(--color-primary)]" />
                <span className="font-medium">{f.label}</span>
              </>
            ) : f.type === 'image' || f.type === 'file' ? (
              <FileField field={f} initial={dv(f.name)} />
            ) : (
              <Input name={f.name} type={f.type ?? 'text'} defaultValue={dv(f.name)} {...rules(f)} />
            )}
          </label>
        ))}
        <div className="flex items-center gap-3 @md:col-span-2">
          <Button type="submit" disabled={status === 'saving'}>
            {status === 'saving' && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
          <AnimatePresence>
            {status === 'saved' && (
              <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" /> Guardado
              </motion.span>
            )}
            {status === 'error' && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-rose-600">{message}</motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </Card>
  )
}

/**
 * Image or file picker. The file travels inside the form values as a data URL
 * ("data:image/png;base64,…"), so any JSON API can store it; an existing value can be a plain URL.
 */
function FileField({ field: f, initial }: { field: FormField; initial?: string }) {
  const [value, setValue] = useState(initial ?? '')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const max = (f.maxSizeMb ?? 5) * 1024 * 1024
  const isImage = f.type === 'image'
  const read = (file: File | undefined) => {
    if (!file) return
    setError('')
    if (isImage && !file.type.startsWith('image/')) return setError('Elegí una imagen (jpg, png, webp…).')
    if (file.size > max) return setError(`El archivo pesa más de ${f.maxSizeMb ?? 5} MB.`)
    const reader = new FileReader()
    reader.onload = () => {
      setValue(String(reader.result))
      setName(file.name)
    }
    reader.readAsDataURL(file)
  }
  const shown = value && isImage ? value : ''
  return (
    <span className="grid gap-2">
      <input type="hidden" name={f.name} value={value} />
      <span
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          read(e.dataTransfer.files[0])
        }}
        className={cn(
          'relative flex min-h-24 cursor-pointer items-center gap-4 rounded-[calc(var(--radius)-4px)] border-2 border-dashed border-border p-3 transition-colors hover:border-primary/50 hover:bg-primary/5',
          over && 'border-primary bg-primary/10',
        )}
      >
        <input
          type="file"
          accept={isImage ? 'image/*' : undefined}
          required={f.required && !value}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(e) => read(e.target.files?.[0])}
          aria-label={f.label}
        />
        {shown ? (
          <img src={shown} alt="" className="size-16 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-md bg-muted text-2xl text-muted-foreground">{isImage ? '🖼' : '📄'}</span>
        )}
        <span className="min-w-0 text-sm">
          <span className="block font-medium">{value ? name || (isImage ? 'Imagen cargada' : 'Archivo cargado') : isImage ? 'Subí una imagen' : 'Subí un archivo'}</span>
          <span className="block text-xs text-muted-foreground">{value ? 'Tocá o arrastrá otro para cambiarlo.' : `Tocá o arrastralo acá. Hasta ${f.maxSizeMb ?? 5} MB.`}</span>
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setValue('')
              setName('')
            }}
            className="relative z-10 ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-rose-600"
          >
            Quitar
          </button>
        )}
      </span>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  )
}
