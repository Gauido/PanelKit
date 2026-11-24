import { ChevronDown, MousePointer2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@panelkit/blocks'
import { registry, type PropField } from '@panelkit/exporter'
import type { Action, Node, Style } from '@panelkit/schema'
import { Field, IconButton, Section, Select, TextInput, fieldClass } from '../lib/ui'
import { useEditor, useSelectedNode } from '../store'

type Col = { field: string; label: string; format?: string }
type FF = Record<string, any>

function useQueryFields(node: Node, key: string): string[] {
  const queries = useEditor((s) => s.project.queries)
  return queries.find((q) => q.id === node.props[key])?.fields ?? []
}

function PropEditor({ node, f }: { node: Node; f: PropField }) {
  const updateNode = useEditor((s) => s.updateNode)
  const queries = useEditor((s) => s.project.queries)
  const set = (v: unknown) => updateNode(node.id, (n) => void (n.props[f.key] = v))
  const value = node.props[f.key]
  const fields = useQueryFields(node, 'queryKey' in f ? f.queryKey : 'query')

  switch (f.kind) {
    case 'text':
      return <Field label={f.label}><TextInput value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} /></Field>
    case 'textarea':
      return <Field label={f.label}><textarea className={cn(fieldClass, 'h-20 py-1.5')} value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} /></Field>
    case 'number':
      return <Field label={f.label}><TextInput type="number" value={(value as number) ?? ''} onChange={(e) => set(e.target.value === '' ? undefined : Number(e.target.value))} /></Field>
    case 'boolean':
      return (
        <label className="flex items-center justify-between text-[13px]">
          <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
          <input type="checkbox" className="size-4 accent-[var(--color-primary)]" checked={Boolean(value)} onChange={(e) => set(e.target.checked)} />
        </label>
      )
    case 'select':
      return <Field label={f.label}><Select value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} options={[{ value: '', label: '—' }, ...f.options]} /></Field>
    case 'query': {
      const list = queries.filter((q) => (f.method === 'WRITE' ? q.method !== 'GET' : q.method === 'GET'))
      return (
        <Field label={f.label} hint={list.length ? undefined : 'Creá una consulta en la pestaña Datos'}>
          <Select value={(value as string) ?? ''} onChange={(e) => set(e.target.value || undefined)} options={[{ value: '', label: 'Sin datos' }, ...list.map((q) => ({ value: q.id, label: `${q.id}  ${q.path}` }))]} />
        </Field>
      )
    }
    case 'field':
      return (
        <Field label={f.label}>
          <Select value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} options={[{ value: '', label: '—' }, ...fields.map((x) => ({ value: x, label: x }))]} />
        </Field>
      )
    case 'columns': {
      const cols = (value as Col[]) ?? []
      const setCols = (next: Col[]) => set(next)
      return (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            <div className="flex gap-1">
              {fields.length > 0 && (
                <button className="rounded px-1.5 py-0.5 text-[11px] text-primary hover:bg-primary/10" onClick={() => setCols(fields.map((x) => ({ field: x, label: x.split('.').at(-1)! })))}>
                  Usar todos
                </button>
              )}
              <IconButton onClick={() => setCols([...cols, { field: fields[0] ?? '', label: 'Columna' }])} aria-label="Agregar columna"><Plus className="size-3.5" /></IconButton>
            </div>
          </div>
          {cols.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 rounded-lg border border-border p-1.5">
              <TextInput value={c.label} onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} aria-label="Título" />
              {fields.length ? (
                <Select value={c.field} onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} options={fields.map((x) => ({ value: x, label: x }))} />
              ) : (
                <TextInput value={c.field} placeholder="campo" onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} />
              )}
              <IconButton onClick={() => setCols(cols.filter((_, j) => j !== i))} aria-label="Quitar"><X className="size-3.5" /></IconButton>
              <Select
                className="col-span-3"
                value={c.format ?? 'text'}
                onChange={(e) => setCols(cols.map((x, j) => (j === i ? { ...x, format: e.target.value } : x)))}
                options={[
                  { value: 'text', label: 'Texto' },
                  { value: 'number', label: 'Número' },
                  { value: 'badge', label: 'Etiqueta de color' },
                  { value: 'email', label: 'Email' },
                  { value: 'date', label: 'Fecha' },
                ]}
              />
            </div>
          ))}
        </div>
      )
    }
    case 'formFields':
      return <FormFieldsEditor value={(value as FF[]) ?? []} onChange={set} />
  }
}

function FormFieldsEditor({ value, onChange }: { value: FF[]; onChange: (v: FF[]) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const patch = (i: number, p: FF) => onChange(value.map((x, j) => (j === i ? { ...x, ...p } : x)))
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Campos y validaciones</span>
        <IconButton onClick={() => onChange([...value, { name: `campo${value.length + 1}`, label: 'Nuevo campo', type: 'text' }])} aria-label="Agregar campo"><Plus className="size-3.5" /></IconButton>
      </div>
      {value.map((f, i) => (
        <div key={i} className="rounded-lg border border-border">
          <button className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[13px]" onClick={() => setOpen(open === i ? null : i)}>
            <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', open !== i && '-rotate-90')} />
            <span className="flex-1 truncate">{f.label}</span>
            <span className="text-[11px] text-muted-foreground">{f.type}{f.required ? ' · obligatorio' : ''}</span>
          </button>
          {open === i && (
            <div className="grid grid-cols-2 gap-2 border-t border-border p-2">
              <Field label="Etiqueta"><TextInput value={f.label} onChange={(e) => patch(i, { label: e.target.value })} /></Field>
              <Field label="Clave (API)"><TextInput value={f.name} onChange={(e) => patch(i, { name: e.target.value.replace(/\s+/g, '_') })} /></Field>
              <Field label="Tipo">
                <Select
                  value={f.type ?? 'text'}
                  onChange={(e) => patch(i, { type: e.target.value })}
                  options={['text', 'email', 'number', 'date', 'textarea', 'select', 'checkbox'].map((t) => ({ value: t, label: t }))}
                />
              </Field>
              <Field label="Ancho">
                <Select value={String(f.span ?? 1)} onChange={(e) => patch(i, { span: Number(e.target.value) })} options={[{ value: '1', label: 'Media fila' }, { value: '2', label: 'Fila completa' }]} />
              </Field>
              {f.type === 'select' && (
                <div className="col-span-2"><Field label="Opciones (separadas por coma)"><TextInput value={f.options ?? ''} onChange={(e) => patch(i, { options: e.target.value })} /></Field></div>
              )}
              <label className="col-span-2 flex items-center gap-2 text-[13px]">
                <input type="checkbox" className="accent-[var(--color-primary)]" checked={Boolean(f.required)} onChange={(e) => patch(i, { required: e.target.checked })} /> Obligatorio
              </label>
              {(f.type === 'text' || f.type === 'textarea' || f.type === 'email' || !f.type) && (
                <>
                  <Field label="Mín. caracteres"><TextInput type="number" value={f.minLength ?? ''} onChange={(e) => patch(i, { minLength: e.target.value ? Number(e.target.value) : undefined })} /></Field>
                  <Field label="Máx. caracteres"><TextInput type="number" value={f.maxLength ?? ''} onChange={(e) => patch(i, { maxLength: e.target.value ? Number(e.target.value) : undefined })} /></Field>
                </>
              )}
              {f.type === 'number' && (
                <>
                  <Field label="Mínimo"><TextInput type="number" value={f.min ?? ''} onChange={(e) => patch(i, { min: e.target.value ? Number(e.target.value) : undefined })} /></Field>
                  <Field label="Máximo"><TextInput type="number" value={f.max ?? ''} onChange={(e) => patch(i, { max: e.target.value ? Number(e.target.value) : undefined })} /></Field>
                </>
              )}
              {(f.type === 'text' || !f.type) && (
                <div className="col-span-2"><Field label="Formato (expresión regular)" hint="Ej: [0-9]{8} para 8 dígitos"><TextInput value={f.pattern ?? ''} onChange={(e) => patch(i, { pattern: e.target.value || undefined })} /></Field></div>
              )}
              <div className="col-span-2"><Field label="Mensaje si no es válido"><TextInput value={f.message ?? ''} onChange={(e) => patch(i, { message: e.target.value || undefined })} /></Field></div>
              <button className="col-span-2 inline-flex items-center justify-center gap-1 rounded-md py-1 text-[12px] text-rose-600 hover:bg-rose-500/10" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 className="size-3.5" /> Quitar campo
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const actionLabels: Record<Action['type'], string> = {
  callQuery: 'Llamar a la API',
  navigate: 'Ir a una página',
  toast: 'Mostrar un aviso',
  refresh: 'Recargar datos',
  openUrl: 'Abrir un enlace',
}

function defaultAction(type: Action['type'], firstQuery: string, firstPath: string): Action {
  switch (type) {
    case 'callQuery': return { type, query: firstQuery, body: 'values' }
    case 'navigate': return { type, to: firstPath }
    case 'toast': return { type, message: 'Listo', tone: 'success' }
    case 'refresh': return { type }
    case 'openUrl': return { type, url: 'https://' }
  }
}

function EventsEditor({ node }: { node: Node }) {
  const { project, updateNode } = useEditor()
  const def = registry[node.type]!
  if (!def.events.length) return <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">Este bloque no dispara eventos.</p>
  const writeQueries = project.queries.filter((q) => q.method !== 'GET')
  return (
    <>
      {def.events.map((ev) => {
        const list = node.events[ev.name] ?? []
        const setList = (next: Action[]) => updateNode(node.id, (n) => void (n.events[ev.name] = next))
        const patch = (i: number, p: Partial<Action>) => setList(list.map((a, j) => (j === i ? ({ ...a, ...p } as Action) : a)))
        return (
          <Section key={ev.name} title={ev.label}>
            {ev.arg && <p className="text-[11px] text-muted-foreground">Podés usar <code className="rounded bg-muted px-1">{`{{${ev.arg}.campo}}`}</code> en los textos.</p>}
            <ol className="grid gap-2">
              {list.map((a, i) => (
                <li key={i} className="grid gap-2 rounded-lg border border-border bg-card p-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{i + 1}</span>
                    <Select value={a.type} onChange={(e) => setList(list.map((x, j) => (j === i ? defaultAction(e.target.value as Action['type'], writeQueries[0]?.id ?? '', project.pages[0]!.path) : x)))} options={Object.entries(actionLabels).map(([v, l]) => ({ value: v, label: l }))} />
                    <IconButton onClick={() => setList(list.filter((_, j) => j !== i))} aria-label="Quitar acción"><Trash2 className="size-3.5" /></IconButton>
                  </div>
                  {a.type === 'callQuery' && (
                    <>
                      <Select value={a.query} onChange={(e) => patch(i, { query: e.target.value })} options={project.queries.map((q) => ({ value: q.id, label: `${q.method} ${q.path}` }))} />
                      {ev.arg && (
                        <Select value={a.body} onChange={(e) => patch(i, { body: e.target.value as 'values' })} options={[{ value: ev.arg, label: ev.arg === 'values' ? 'Enviar los datos del formulario' : 'Enviar la fila' }, { value: 'none', label: 'Sin cuerpo' }]} />
                      )}
                    </>
                  )}
                  {a.type === 'navigate' && <Select value={a.to} onChange={(e) => patch(i, { to: e.target.value })} options={project.pages.map((p) => ({ value: p.path, label: p.title }))} />}
                  {a.type === 'toast' && (
                    <div className="grid grid-cols-[1fr_100px] gap-2">
                      <TextInput value={a.message} onChange={(e) => patch(i, { message: e.target.value })} />
                      <Select value={a.tone} onChange={(e) => patch(i, { tone: e.target.value as 'success' })} options={[{ value: 'success', label: 'Éxito' }, { value: 'info', label: 'Info' }, { value: 'error', label: 'Error' }]} />
                    </div>
                  )}
                  {a.type === 'openUrl' && <TextInput value={a.url} onChange={(e) => patch(i, { url: e.target.value })} />}
                </li>
              ))}
            </ol>
            <button
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              onClick={() => setList([...list, defaultAction('toast', '', '/')])}
            >
              <Plus className="size-3.5" /> Agregar acción
            </button>
          </Section>
        )
      })}
    </>
  )
}

function StyleEditor({ node }: { node: Node }) {
  const updateNode = useEditor((s) => s.updateNode)
  const set = (p: Partial<Style>) => updateNode(node.id, (n) => void (n.style = { ...n.style, ...p }))
  const opt = (pairs: [string, string][]) => [{ value: '', label: 'Por defecto' }, ...pairs.map(([value, label]) => ({ value, label }))]
  return (
    <Section title="Estilo">
      <Field label={`Ancho: ${node.layout.span} de 12 columnas`}>
        <input type="range" min={1} max={12} value={node.layout.span} onChange={(e) => updateNode(node.id, (n) => void (n.layout.span = Number(e.target.value)))} className="accent-[var(--color-primary)]" />
      </Field>
      <Field label="Espaciado interno"><Select value={node.style.padding ?? ''} onChange={(e) => set({ padding: (e.target.value || undefined) as Style['padding'] })} options={opt([['none', 'Ninguno'], ['sm', 'Chico'], ['md', 'Medio'], ['lg', 'Grande']])} /></Field>
      <Field label="Fondo"><Select value={node.style.background ?? ''} onChange={(e) => set({ background: (e.target.value || undefined) as Style['background'] })} options={opt([['muted', 'Gris suave'], ['primary', 'Color principal'], ['transparent', 'Transparente']])} /></Field>
      <Field label="Alineación"><Select value={node.style.align ?? ''} onChange={(e) => set({ align: (e.target.value || undefined) as Style['align'] })} options={opt([['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']])} /></Field>
      <Field label="Sombra"><Select value={node.style.shadow ?? ''} onChange={(e) => set({ shadow: (e.target.value || undefined) as Style['shadow'] })} options={opt([['none', 'Sin sombra'], ['sm', 'Suave'], ['lg', 'Marcada']])} /></Field>
      <Field label="Clases Tailwind (avanzado)"><TextInput value={node.style.className ?? ''} placeholder="ej: ring-1 ring-primary" onChange={(e) => set({ className: e.target.value || undefined })} /></Field>
    </Section>
  )
}

const tabs = ['Propiedades', 'Estilo', 'Eventos', 'JSON'] as const

export function Inspector() {
  const node = useSelectedNode()
  const updateNode = useEditor((s) => s.updateNode)
  const [tab, setTab] = useState<(typeof tabs)[number]>('Propiedades')
  const [jsonError, setJsonError] = useState('')

  if (!node) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <MousePointer2 className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">Elegí un bloque</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Hacé clic en cualquier bloque del lienzo para editar sus datos, estilo y eventos.</p>
        </div>
      </div>
    )
  }
  const def = registry[node.type]
  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-card/90 px-4 pt-4 backdrop-blur">
        <p className="text-sm font-semibold">{def?.label ?? node.type}</p>
        <p className="text-[11px] text-muted-foreground">{def?.description}</p>
        <div className="mt-3 flex gap-1">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('relative px-2 pb-2 text-[13px] transition-colors', tab === t ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {t}
              {tab === t && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>
      {tab === 'Propiedades' && def && (
        <Section title="Contenido y datos">
          {def.fields.map((f) => (
            <PropEditor key={f.key} node={node} f={f} />
          ))}
        </Section>
      )}
      {tab === 'Estilo' && <StyleEditor node={node} />}
      {tab === 'Eventos' && <EventsEditor node={node} />}
      {tab === 'JSON' && (
        <Section title="Este bloque en JSON">
          <textarea
            key={node.id}
            defaultValue={JSON.stringify(node, null, 2)}
            spellCheck={false}
            className={cn(fieldClass, 'h-96 py-2 font-mono text-[11px] leading-relaxed')}
            onBlur={(e) => {
              try {
                const next = JSON.parse(e.target.value) as Node
                updateNode(node.id, (n) => Object.assign(n, { ...next, id: n.id }))
                setJsonError('')
              } catch (err) {
                setJsonError(err instanceof Error ? err.message : String(err))
              }
            }}
          />
          {jsonError ? <p className="text-[11px] text-rose-600">{jsonError}</p> : <p className="text-[11px] text-muted-foreground">Se aplica al salir del campo.</p>}
        </Section>
      )}
    </div>
  )
}
