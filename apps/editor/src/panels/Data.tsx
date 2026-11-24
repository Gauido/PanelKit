import { CheckCircle2, Loader2, Play, Plus, Trash2, XCircle } from 'lucide-react'
import { useState } from 'react'
import { envVars, inferFields, newId, type Query } from '@panelkit/schema'
import { toRows } from '@panelkit/blocks'
import { Field, IconButton, Section, Select, TextInput } from '../lib/ui'
import { apiFor } from '../lib/actions'
import { useEditor } from '../store'

function QueryRow({ q, index }: { q: Query; index: number }) {
  const { project, update, env } = useEditor()
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'ok' | 'error'; msg?: string }>({ status: 'idle' })

  async function test() {
    const api = apiFor(project, q.source, env)
    if (!api) return
    setState({ status: 'loading' })
    try {
      const res = await api.request('GET', q.path)
      const fields = inferFields(toRows(res))
      update((d) => void (d.queries[index]!.fields = fields))
      setState({ status: 'ok', msg: `${toRows(res).length} filas · ${fields.length} campos` })
    } catch (e) {
      setState({ status: 'error', msg: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <TextInput
          value={q.id}
          aria-label="Nombre de la consulta"
          className="font-medium"
          onChange={(e) => {
            const id = e.target.value.replace(/[^a-zA-Z0-9]/g, '')
            const old = q.id
            update((d) => {
              d.queries[index]!.id = id
              for (const p of d.pages)
                for (const n of p.children) {
                  if (n.props.query === old) n.props.query = id
                  for (const list of Object.values(n.events)) for (const a of list) if (a.type === 'callQuery' && a.query === old) a.query = id
                }
            })
          }}
        />
        <IconButton onClick={() => update((d) => void d.queries.splice(index, 1))} aria-label="Eliminar consulta">
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>
      <div className="grid grid-cols-[80px_1fr] gap-2">
        <Select
          value={q.method}
          onChange={(e) => update((d) => void (d.queries[index]!.method = e.target.value as Query['method']))}
          options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ value: m, label: m }))}
        />
        <TextInput value={q.path} placeholder="/clientes" onChange={(e) => update((d) => void (d.queries[index]!.path = e.target.value))} />
      </div>
      {project.dataSources.length > 1 && (
        <Select
          value={q.source}
          onChange={(e) => update((d) => void (d.queries[index]!.source = e.target.value))}
          options={project.dataSources.map((s) => ({ value: s.id, label: s.name }))}
        />
      )}
      {q.method === 'GET' && (
        <div className="flex items-center gap-2 text-[11px]">
          <button onClick={test} className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-medium text-primary-foreground transition hover:brightness-110">
            {state.status === 'loading' ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />} Probar
          </button>
          {state.status === 'ok' && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="size-3" />{state.msg}</span>}
          {state.status === 'error' && <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="size-3" />{state.msg}</span>}
        </div>
      )}
      {q.fields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {q.fields.map((f) => (
            <span key={f} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{f}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export function Data() {
  const { project, update, env, setEnv } = useEditor()
  const vars = envVars(project)
  return (
    <div>
      <Section
        title="Fuentes de datos"
        action={
          <IconButton
            aria-label="Agregar API"
            onClick={() => update((d) => void d.dataSources.push({ id: newId('ds'), type: 'rest', name: 'Mi API', baseUrl: '{{env.API_URL}}', headers: {} }))}
          >
            <Plus className="size-4" />
          </IconButton>
        }
      >
        {project.dataSources.map((ds, i) => (
          <div key={ds.id} className="grid gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <TextInput value={ds.name} className="font-medium" onChange={(e) => update((d) => void (d.dataSources[i]!.name = e.target.value))} />
              <IconButton onClick={() => update((d) => void d.dataSources.splice(i, 1))} aria-label="Eliminar API">
                <Trash2 className="size-3.5" />
              </IconButton>
            </div>
            <Field label="URL base" hint="Usá {{env.NOMBRE}} para valores secretos o que cambian por entorno.">
              <TextInput value={ds.baseUrl} onChange={(e) => update((d) => void (d.dataSources[i]!.baseUrl = e.target.value))} />
            </Field>
            <Field label="Header Authorization (opcional)">
              <TextInput
                value={ds.headers.Authorization ?? ''}
                placeholder="Bearer {{env.API_TOKEN}}"
                onChange={(e) =>
                  update((d) => {
                    if (e.target.value) d.dataSources[i]!.headers.Authorization = e.target.value
                    else delete d.dataSources[i]!.headers.Authorization
                  })
                }
              />
            </Field>
          </div>
        ))}
      </Section>
      {vars.length > 0 && (
        <Section title="Variables de entorno">
          <p className="text-[11px] text-muted-foreground">Solo se usan para probar acá. No se guardan en el proyecto ni en el export: van al .env del repo.</p>
          {vars.map((v) => (
            <Field key={v} label={v}>
              <TextInput value={env[v] ?? ''} onChange={(e) => setEnv(v, e.target.value)} type={/TOKEN|KEY|SECRET/.test(v) ? 'password' : 'text'} />
            </Field>
          ))}
        </Section>
      )}
      <Section
        title="Consultas"
        action={
          project.dataSources[0] && (
            <IconButton
              aria-label="Agregar consulta"
              onClick={() => update((d) => void d.queries.push({ id: `consulta${d.queries.length + 1}`, source: d.dataSources[0]!.id, method: 'GET', path: '/', fields: [] }))}
            >
              <Plus className="size-4" />
            </IconButton>
          )
        }
      >
        {project.queries.map((q, i) => (
          <QueryRow key={i} q={q} index={i} />
        ))}
      </Section>
    </div>
  )
}
