import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input, inputClass } from '../ui/input'
import { cn } from '../../lib/utils'

export type FormField = {
  name: string
  label: string
  type?: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox'
  required?: boolean
  /** Comma separated, for "select". */
  options?: string
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
  onSubmit?: (values: Record<string, unknown>) => Promise<unknown> | void
}

export function EntityForm({ title, description, fields, submitLabel = 'Guardar', onSubmit }: EntityFormProps) {
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
      el.reset()
      setTimeout(() => setStatus('idle'), 2500)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <Card className="p-5">
      {title && <h3 className="font-semibold tracking-tight">{title}</h3>}
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className={cn('grid min-w-0 gap-1.5 text-sm', (f.span === 2 || f.type === 'textarea') && 'sm:col-span-2', f.type === 'checkbox' && 'flex items-center gap-2')}>
            {f.type !== 'checkbox' && (
              <span className="font-medium">
                {f.label}
                {f.required && <span className="text-primary"> *</span>}
              </span>
            )}
            {f.type === 'textarea' ? (
              <textarea name={f.name} required={f.required} minLength={f.minLength} maxLength={f.maxLength} placeholder={f.placeholder} onInvalid={rules(f).onInvalid} onInput={rules(f).onInput} rows={3} className={cn(inputClass, 'h-auto py-2')} />
            ) : f.type === 'select' ? (
              <select name={f.name} required={f.required} onInvalid={rules(f).onInvalid} onChange={rules(f).onInput} className={inputClass} defaultValue="">
                <option value="" disabled>Elegir…</option>
                {(f.options ?? '').split(',').map((o) => o.trim()).filter(Boolean).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : f.type === 'checkbox' ? (
              <>
                <input type="checkbox" name={f.name} className="size-4 accent-[var(--color-primary)]" />
                <span className="font-medium">{f.label}</span>
              </>
            ) : (
              <Input name={f.name} type={f.type ?? 'text'} {...rules(f)} />
            )}
          </label>
        ))}
        <div className="flex items-center gap-3 sm:col-span-2">
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
