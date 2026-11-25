import { ChevronDown, MousePointer2, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@panelkit/blocks'
import { registry, spansFor, type PropField } from '@panelkit/exporter'
import { walkNodes, type Action, type Node, type Style } from '@panelkit/schema'
import { Field, IconButton, Section, Select, TextInput, fieldClass } from '../lib/ui'
import { useCurrentPage, useEditor, useSelectedNode } from '../store'
import { fromExpr, ops, toExpr, type Condition, type Op } from '../lib/condition'

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
    case 'textarea': {
      const text = typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value)
      const insert = (token: string) => set(text ? `${text}${/\s$/.test(text) ? '' : ' '}${token}` : token)
      return (
        <div className="grid gap-1 text-[13px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
            <InsertData node={node} onInsert={insert} />
          </div>
          {f.kind === 'text' ? (
            <TextInput value={text} onChange={(e) => set(e.target.value)} aria-label={f.label} />
          ) : (
            <textarea className={cn(fieldClass, 'h-20 py-1.5')} value={text} onChange={(e) => set(e.target.value)} aria-label={f.label} />
          )}
        </div>
      )
    }
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
                  { value: 'money', label: 'Dinero' },
                  { value: 'badge', label: 'Estado (etiqueta de color)' },
                  { value: 'boolean', label: 'Sí / No' },
                  { value: 'email', label: 'Email' },
                  { value: 'date', label: 'Fecha' },
                  { value: 'datetime', label: 'Fecha y hora' },
                ]}
              />
            </div>
          ))}
        </div>
      )
    }
    case 'formFields':
      return <FormFieldsEditor value={(value as FF[]) ?? []} onChange={set} />
    case 'code':
      return (
        <Field label={f.label} hint="Podés usar clases de Tailwind y de los frameworks que instales en Estilo.">
          <textarea spellCheck={false} className={cn(fieldClass, 'h-72 py-2 font-mono text-[11px] leading-relaxed')} value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} />
        </Field>
      )
  }
}

const fieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Teléfono' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Fecha' },
  { value: 'time', label: 'Hora' },
  { value: 'datetime-local', label: 'Fecha y hora' },
  { value: 'select', label: 'Lista de opciones' },
  { value: 'checkbox', label: 'Casilla (sí / no)' },
  { value: 'url', label: 'Enlace' },
  { value: 'password', label: 'Contraseña' },
]
const typeLabel = (t?: string) => fieldTypes.find((x) => x.value === (t ?? 'text'))?.label ?? t

function FormFieldsEditor({ value, onChange }: { value: FF[]; onChange: (v: FF[]) => void }) {
  const [open, setOpen] = useState<number | null>(null)
  const queries = useEditor((s) => s.project.queries)
  const getQueries = queries.filter((q) => q.method === 'GET')
  const fieldsOf = (id: string) => queries.find((q) => q.id === id)?.fields ?? []
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
            <span className="text-[11px] text-muted-foreground">{typeLabel(f.type)}{f.required ? ' · obligatorio' : ''}</span>
          </button>
          {open === i && (
            <div className="grid grid-cols-2 gap-2 border-t border-border p-2">
              <Field label="Etiqueta"><TextInput value={f.label} onChange={(e) => patch(i, { label: e.target.value })} /></Field>
              <Field label="Clave (API)"><TextInput value={f.name} onChange={(e) => patch(i, { name: e.target.value.replace(/\s+/g, '_') })} /></Field>
              <Field label="Tipo">
                <Select
                  value={f.type ?? 'text'}
                  onChange={(e) => patch(i, { type: e.target.value })}
                  options={fieldTypes}
                />
              </Field>
              <Field label="Ancho">
                <Select value={String(f.span ?? 1)} onChange={(e) => patch(i, { span: Number(e.target.value) })} options={[{ value: '1', label: 'Media fila' }, { value: '2', label: 'Fila completa' }]} />
              </Field>
              {f.type === 'select' && (
                <>
                  <div className="col-span-2"><Field label="Opciones fijas (separadas por coma)"><TextInput value={f.options ?? ''} onChange={(e) => patch(i, { options: e.target.value })} /></Field></div>
                  <div className="col-span-2">
                    <Field label="Opciones desde la API" hint="Si agregás registros, aparecen solos en la lista.">
                      <Select value={f.optionsQuery ?? ''} onChange={(e) => patch(i, { optionsQuery: e.target.value || undefined })} options={[{ value: '', label: 'No' }, ...getQueries.map((q) => ({ value: q.id, label: `${q.id}  ${q.path}` }))]} />
                    </Field>
                  </div>
                  {f.optionsQuery && (
                    <>
                      <Field label="Mostrar"><Select value={f.optionLabel ?? ''} onChange={(e) => patch(i, { optionLabel: e.target.value })} options={[{ value: '', label: '—' }, ...fieldsOf(f.optionsQuery).map((x) => ({ value: x, label: x }))]} /></Field>
                      <Field label="Guardar"><Select value={f.optionValue ?? ''} onChange={(e) => patch(i, { optionValue: e.target.value })} options={[{ value: '', label: '—' }, ...fieldsOf(f.optionsQuery).map((x) => ({ value: x, label: x }))]} /></Field>
                    </>
                  )}
                </>
              )}
              <label className="col-span-2 flex items-center gap-2 text-[13px]">
                <input type="checkbox" className="accent-[var(--color-primary)]" checked={Boolean(f.required)} onChange={(e) => patch(i, { required: e.target.checked })} /> Obligatorio
              </label>
              {(f.type === 'text' || f.type === 'textarea' || f.type === 'email' || f.type === 'tel' || f.type === 'password' || !f.type) && (
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
              {(f.type === 'text' || f.type === 'tel' || !f.type) && (
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
  confirm: 'Pedir confirmación',
  setState: 'Guardar en una variable',
  openModal: 'Abrir modal / panel',
  closeModal: 'Cerrar modal / panel',
  runCode: 'Ejecutar código propio',
  navigate: 'Ir a una página',
  toast: 'Mostrar un aviso',
  refresh: 'Recargar datos',
  openUrl: 'Abrir un enlace',
}

const argLabels: Record<string, string> = {
  values: 'Enviar los datos del formulario',
  row: 'Enviar la fila',
  slot: 'Enviar el turno (recurso, fecha, hora)',
  day: 'Enviar el día',
}

function defaultAction(type: Action['type'], firstQuery: string, firstPath: string): Action {
  switch (type) {
    case 'callQuery': return { type, query: firstQuery, body: 'values' }
    case 'confirm': return { type, message: '¿Seguro?' }
    case 'setState': return { type, key: 'seleccionado', value: '{{row}}' }
    case 'openModal': return { type, target: '' }
    case 'closeModal': return { type, target: '' }
    case 'runCode': return { type, code: "// row, values, state, setState, apis, navigate, toast, refresh\ntoast('Hola ' + (row?.name ?? ''))" }
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
  const page = project.pages.find((pg) => [...walkNodes(pg.children)].some((n) => n.id === node.id)) ?? project.pages[0]!
  const modals = [...walkNodes(page.children)].filter((n) => n.type === 'Modal').map((n) => ({ value: n.id, label: String(n.props.title ?? 'Modal') }))
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
                        <Select value={a.body === 'none' ? 'none' : ev.arg} onChange={(e) => patch(i, { body: e.target.value as 'values' })} options={[{ value: ev.arg, label: argLabels[ev.arg] ?? ev.arg }, { value: 'none', label: 'Sin cuerpo' }]} />
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
                  {a.type === 'confirm' && <TextInput value={a.message} onChange={(e) => patch(i, { message: e.target.value })} />}
                  {a.type === 'setState' && (
                    <div className="grid grid-cols-[1fr_1.3fr] gap-2">
                      <TextInput value={a.key} placeholder="variable" aria-label="Nombre de la variable" onChange={(e) => patch(i, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })} />
                      <TextInput value={a.value} placeholder={ev.arg ? `{{${ev.arg}}}` : 'valor'} aria-label="Valor" onChange={(e) => patch(i, { value: e.target.value })} />
                      <p className="col-span-2 text-[11px] text-muted-foreground">Después usala en cualquier texto, consulta o formulario como <code className="rounded bg-muted px-1">{`{{state.${a.key || 'variable'}}}`}</code>.</p>
                    </div>
                  )}
                  {(a.type === 'openModal' || a.type === 'closeModal') && (
                    modals.length ? (
                      <Select value={a.target} onChange={(e) => patch(i, { target: e.target.value })} options={[{ value: '', label: 'Elegir modal…' }, ...modals]} />
                    ) : (
                      <p className="text-[11px] text-muted-foreground">Agregá un bloque “Modal / panel” a esta página primero.</p>
                    )
                  )}
                  {a.type === 'runCode' && (
                    <textarea
                      spellCheck={false}
                      className={cn(fieldClass, 'h-32 py-2 font-mono text-[11px] leading-relaxed')}
                      value={a.code}
                      onChange={(e) => patch(i, { code: e.target.value })}
                      aria-label="Código"
                    />
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

const deviceRows = [
  { id: 'desktop', label: 'Escritorio', key: 'span' },
  { id: 'tablet', label: 'Tablet', key: 'spanTablet' },
  { id: 'mobile', label: 'Celular', key: 'spanMobile' },
] as const

/** Width per device and where the block is hidden. */
function ResponsiveEditor({ node }: { node: Node }) {
  const updateNode = useEditor((s) => s.updateNode)
  const spans = spansFor(node.layout)
  const hidden = new Set(node.layout.hide ?? [])
  return (
    <div className="grid gap-2">
      <span className="text-xs font-medium text-muted-foreground">Ancho y visibilidad por pantalla (de 12 columnas)</span>
      {deviceRows.map((d) => (
        <div key={d.id} className="grid grid-cols-[64px_minmax(0,1fr)_24px_auto] items-center gap-2 text-[12px]">
          <span>{d.label}</span>
          <input
            type="range"
            min={1}
            max={12}
            value={spans[d.id]}
            disabled={hidden.has(d.id)}
            aria-label={`Ancho en ${d.label}`}
            onChange={(e) => updateNode(node.id, (n) => void (n.layout[d.key] = Number(e.target.value)))}
            className="accent-[var(--color-primary)] disabled:opacity-30"
          />
          <span className="text-right tabular-nums text-muted-foreground">{spans[d.id]}</span>
          <label className="flex items-center gap-1 text-muted-foreground">
            <input
              type="checkbox"
              className="accent-[var(--color-primary)]"
              checked={hidden.has(d.id)}
              onChange={(e) =>
                updateNode(node.id, (n) => {
                  const next = new Set(n.layout.hide ?? [])
                  if (e.target.checked) next.add(d.id)
                  else next.delete(d.id)
                  n.layout.hide = next.size ? [...next] : undefined
                })
              }
            />
            Ocultar
          </label>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">Tip: elegí Tablet o Celular arriba y usá − / + en el bloque para ajustar ese tamaño.</p>
    </div>
  )
}

function StyleEditor({ node }: { node: Node }) {
  const updateNode = useEditor((s) => s.updateNode)
  const set = (p: Partial<Style>) => updateNode(node.id, (n) => void (n.style = { ...n.style, ...p }))
  const opt = (pairs: [string, string][]) => [{ value: '', label: 'Por defecto' }, ...pairs.map(([value, label]) => ({ value, label }))]
  const pick = <K extends keyof Style>(key: K, label: string, pairs: [string, string][]) => (
    <Field label={label}>
      <Select value={(node.style[key] as string | undefined) ?? ''} onChange={(e) => set({ [key]: e.target.value || undefined } as Partial<Style>)} options={opt(pairs)} />
    </Field>
  )
  return (
    <>
      <Section title="Tamaño por dispositivo">
        <ResponsiveEditor node={node} />
      </Section>
      <Section title="Caja">
        <div className="grid grid-cols-2 gap-3">
          {pick('padding', 'Espaciado interno', [['none', 'Ninguno'], ['sm', 'Chico'], ['md', 'Medio'], ['lg', 'Grande']])}
          {pick('background', 'Fondo', [['muted', 'Gris suave'], ['primary', 'Color principal'], ['transparent', 'Transparente']])}
          {pick('border', 'Borde', [['none', 'Sin borde'], ['default', 'Fino'], ['primary', 'Color principal'], ['dashed', 'Punteado']])}
          {pick('radius', 'Esquinas', [['none', 'Rectas'], ['sm', 'Apenas'], ['md', 'Medias'], ['lg', 'Redondeadas'], ['xl', 'Muy redondeadas'], ['full', 'Círculo / píldora']])}
          {pick('shadow', 'Sombra', [['none', 'Sin sombra'], ['sm', 'Suave'], ['lg', 'Marcada']])}
        </div>
      </Section>
      <Section title="Texto">
        <div className="grid grid-cols-2 gap-3">
          {pick('textColor', 'Color', [['muted', 'Gris'], ['primary', 'Principal'], ['success', 'Verde'], ['warning', 'Ámbar'], ['danger', 'Rojo']])}
          {pick('fontSize', 'Tamaño', [['xs', 'Muy chico'], ['sm', 'Chico'], ['base', 'Normal'], ['lg', 'Grande'], ['xl', 'Más grande'], ['2xl', 'Enorme'], ['3xl', 'Gigante'], ['4xl', 'Titular']])}
          {pick('fontWeight', 'Grosor', [['normal', 'Normal'], ['medium', 'Medio'], ['semibold', 'Semi negrita'], ['bold', 'Negrita']])}
          {pick('align', 'Alineación', [['left', 'Izquierda'], ['center', 'Centro'], ['right', 'Derecha']])}
        </div>
      </Section>
      <section className="border-b border-border px-4 py-4">
        <details open={Boolean(node.style.css || node.style.className)}>
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avanzado: CSS y clases</summary>
          <div className="mt-3 grid gap-4">
            <CssEditor node={node} />
            <Field label="Clases Tailwind"><TextInput value={node.style.className ?? ''} placeholder="ej: ring-1 ring-primary" onChange={(e) => set({ className: e.target.value || undefined })} /></Field>
          </div>
        </details>
      </section>
    </>
  )
}

/** Any CSS property as name / value rows, for what the options don't cover. */
function CssEditor({ node }: { node: Node }) {
  const updateNode = useEditor((s) => s.updateNode)
  const rows = Object.entries(node.style.css ?? {})
  const save = (next: [string, string][]) =>
    updateNode(node.id, (n) => {
      const css = Object.fromEntries(next)
      n.style = { ...n.style, css: Object.keys(css).length ? css : undefined }
    })
  return (
    <div className="grid gap-2">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex gap-1.5">
          <TextInput className="font-mono text-[12px]" value={k} placeholder="propiedad" onChange={(e) => save(rows.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
          <TextInput className="font-mono text-[12px]" value={v} placeholder="valor" onChange={(e) => save(rows.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
          <button className="rounded-md px-2 text-muted-foreground hover:bg-muted hover:text-rose-600" onClick={() => save(rows.filter((_, j) => j !== i))} aria-label="Quitar">
            ×
          </button>
        </div>
      ))}
      <button className="justify-self-start text-[13px] font-medium text-primary hover:underline" onClick={() => save([...rows, [rows.some(([k]) => k === '') ? `prop${rows.length}` : '', '']])}>
        + Agregar propiedad
      </button>
      <p className="text-[11px] text-muted-foreground">Cualquier propiedad CSS: <code>min-height: 320px</code>, <code>background: linear-gradient(...)</code>, <code>border-left: 4px solid #22c55e</code>.</p>
    </div>
  )
}

/** Blocks that contain `id`, outermost first. */
function ancestorsOf(nodes: Node[], id: string, trail: Node[] = []): Node[] | null {
  for (const n of nodes) {
    if (n.id === id) return trail
    const hit = n.children && ancestorsOf(n.children, id, [...trail, n])
    if (hit) return hit
  }
  return null
}

/** What a block can read: the current record inside a Lista repetida, and the page variables. */
function useScopeSources(node: Node): { value: string; label: string }[] {
  const project = useEditor((s) => s.project)
  const page = useCurrentPage()
  const vars = new Set(Object.keys(page.state ?? {}))
  for (const n of walkNodes(page.children)) {
    if (n.type === 'Filter') vars.add(String(n.props.stateKey || 'filtro'))
    for (const list of Object.values(n.events)) for (const a of list) if (a.type === 'setState' && a.key) vars.add(a.key)
  }
  const repeater = [...(ancestorsOf(page.children, node.id) ?? [])].reverse().find((a) => a.type === 'Repeater')
  const itemFields = repeater ? (project.queries.find((q) => q.id === repeater.props.query)?.fields ?? []) : []
  return [
    ...itemFields.map((f) => ({ value: `item.${f}`, label: `Registro → ${f}` })),
    ...[...vars].map((v) => ({ value: `state.${v}`, label: `Variable → ${v}` })),
  ]
}

/** "+ Dato": puts {{item.x}} / {{state.x}} into a text without typing the braces. */
function InsertData({ node, onInsert }: { node: Node; onInsert: (token: string) => void }) {
  const sources = useScopeSources(node)
  if (!sources.length) return null
  return (
    <select
      value=""
      onChange={(e) => e.target.value && onInsert(`{{${e.target.value}}}`)}
      className="h-6 rounded-md border border-border bg-background px-1 text-[11px] text-primary"
      aria-label="Insertar un dato"
      title="Insertar un dato que cambia (de la lista o de una variable)"
    >
      <option value="">+ Dato</option>
      {sources.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  )
}

/** Layer name and "show only if", built from lists (code only under Avanzado). */
function VisibilityEditor({ node }: { node: Node }) {
  const updateNode = useEditor((s) => s.updateNode)
  const project = useEditor((s) => s.project)
  const page = useCurrentPage()
  const parsed = fromExpr(node.visibleIf)
  const [mode, setMode] = useState<'always' | 'simple' | 'code'>(() => (!node.visibleIf?.trim() ? 'always' : parsed ? 'simple' : 'code'))

  const sources = useScopeSources(node)
  const cond: Condition = parsed ?? { left: sources[0]?.value ?? 'state.', op: 'eq', value: '' }
  if (cond.left && !sources.some((s) => s.value === cond.left)) sources.push({ value: cond.left, label: cond.left.replace(/^item\./, 'Registro → ').replace(/^state\./, 'Variable → ') })
  const save = (expr: string | undefined) => updateNode(node.id, (n) => void (n.visibleIf = expr || undefined))
  const setCond = (patch: Partial<Condition>) => save(toExpr({ ...cond, ...patch }))
  const op = ops.find((o) => o.value === cond.op)!

  return (
    <Section title="Nombre y visibilidad">
      <Field label="Nombre en Capas">
        <TextInput value={node.name ?? ''} placeholder={registry[node.type]?.label ?? node.type} onChange={(e) => updateNode(node.id, (n) => void (n.name = e.target.value || undefined))} />
      </Field>
      <Field label="Mostrar este bloque">
        <Select
          value={mode}
          onChange={(e) => {
            const m = e.target.value as typeof mode
            setMode(m)
            if (m === 'always') save(undefined)
            if (m === 'simple' && !parsed) save(sources.length ? toExpr(cond) : undefined)
          }}
          options={[
            { value: 'always', label: 'Siempre' },
            { value: 'simple', label: 'Solo si se cumple algo' },
            { value: 'code', label: 'Avanzado: con código' },
          ]}
        />
      </Field>
      {mode === 'simple' &&
        (sources.length ? (
          <div className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <Select value={cond.left} onChange={(e) => setCond({ left: e.target.value })} options={sources} />
            <Select value={cond.op} onChange={(e) => setCond({ op: e.target.value as Op })} options={ops.map((o) => ({ value: o.value, label: o.label }))} />
            {op.needsValue && <TextInput value={cond.value} placeholder="valor, ej: Pagada" onChange={(e) => setCond({ value: e.target.value })} />}
            <p className="text-[11px] text-muted-foreground">
              Se ve solo cuando <b>{sources.find((s) => s.value === cond.left)?.label ?? cond.left}</b> {op.label}
              {op.needsValue && <> «{cond.value}»</>}.
            </p>
          </div>
        ) : (
          <p className="rounded-lg bg-muted p-3 text-[11px] text-muted-foreground">
            Todavía no hay nada para mirar. Agregá un Filtro, una acción “Guardar en variable”, o poné este bloque adentro de una Lista repetida.
          </p>
        ))}
      {mode === 'code' && (
        <Field label="Condición en JavaScript" hint="Usá state.x para variables e item.x dentro de una Lista repetida.">
          <TextInput className="font-mono text-[12px]" value={node.visibleIf ?? ''} placeholder="ej: state.turno?.status === 'Pendiente'" onChange={(e) => save(e.target.value)} />
        </Field>
      )}
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
    <div data-inspector>
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
      {tab === 'Propiedades' && <VisibilityEditor key={node.id} node={node} />}
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
