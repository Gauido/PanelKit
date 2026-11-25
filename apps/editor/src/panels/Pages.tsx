import { Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import type { Project } from '@panelkit/schema'
import { cn } from '@panelkit/blocks'
import { Icon, pageIcons } from '../lib/icon'
import { Field, IconButton, Section, Select, TextInput } from '../lib/ui'
import { useCurrentPage, useEditor } from '../store'

export function Pages() {
  const { project, pageId, selectPage, addPage, removePage, update } = useEditor()
  const page = useCurrentPage()
  return (
    <div>
      <Section title="Páginas" action={<IconButton onClick={addPage} aria-label="Agregar página"><Plus className="size-4" /></IconButton>}>
        <div className="grid gap-1">
          {project.pages.map((p) => (
            <div key={p.id} className={cn('group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]', p.id === pageId ? 'bg-muted font-medium' : 'hover:bg-muted/60')}>
              <button className="flex flex-1 items-center gap-2 text-left" onClick={() => selectPage(p.id)}>
                <Icon name={p.icon} className="size-4 text-muted-foreground" />
                {p.title}
                <span className="ml-auto text-[11px] font-normal text-muted-foreground">{p.path}</span>
              </button>
              {project.pages.length > 1 && (
                <IconButton className="opacity-0 group-hover:opacity-100" onClick={() => removePage(p.id)} aria-label="Eliminar página">
                  <Trash2 className="size-3.5" />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      </Section>
      <AccessSettings />
      <Section title="Página actual">
        <Field label="Título">
          <TextInput value={page.title} onChange={(e) => update((d) => void (d.pages.find((x) => x.id === page.id)!.title = e.target.value))} />
        </Field>
        <Field label="Ruta" hint="Empieza con /">
          <TextInput
            value={page.path}
            onChange={(e) => {
              const v = e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}`
              update((d) => void (d.pages.find((x) => x.id === page.id)!.path = v.replace(/\s+/g, '-')))
            }}
          />
        </Field>
        <Field label="Ícono en el menú">
          <Select
            value={page.icon}
            options={pageIcons.map((i) => ({ value: i, label: i }))}
            onChange={(e) => update((d) => void (d.pages.find((x) => x.id === page.id)!.icon = e.target.value))}
          />
        </Field>
        {project.auth.enabled && (
          <RolePicker
            label="Quién puede ver esta página"
            roles={project.auth.roles}
            value={page.roles ?? []}
            onChange={(roles) => update((d) => void (d.pages.find((x) => x.id === page.id)!.roles = roles.length ? roles : undefined))}
          />
        )}
      </Section>
    </div>
  )
}

/** Pick roles with checkboxes. Nothing checked = everyone who signed in. */
export function RolePicker({ label, roles, value, onChange }: { label: string; roles: string[]; value: string[]; onChange: (roles: string[]) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {roles.map((r) => {
          const on = value.includes(r)
          return (
            <button
              key={r}
              onClick={() => onChange(on ? value.filter((x) => x !== r) : [...value, r])}
              className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors', on ? 'border-primary bg-primary/10 font-medium text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
              aria-pressed={on}
            >
              {on ? '✓ ' : ''}
              {r}
            </button>
          )
        })}
      </div>
      <span className="text-[11px] text-muted-foreground">{value.length ? `Solo: ${value.join(', ')}.` : 'Sin marcar: todos los que ingresan.'}</span>
    </div>
  )
}

const demoUsers = [
  { id: 1, name: 'Ana Admin', email: 'admin@demo.com', password: 'demo123', role: 'admin' },
  { id: 2, name: 'Bruno Empleado', email: 'empleado@demo.com', password: 'demo123', role: 'empleado' },
]

/** Sign in with email and password, and the roles people can have. */
function AccessSettings() {
  const { project, update } = useEditor()
  const auth = project.auth
  const [newRole, setNewRole] = useState('')
  const set = (patch: Partial<Project['auth']>) => update((d) => void (d.auth = { ...d.auth, ...patch }))
  const source = project.dataSources.find((d) => d.id === auth.source)
  const users = source?.type === 'static' ? source.tables.users : undefined
  return (
    <Section title="Acceso">
      <label className="flex items-center justify-between gap-3 text-[13px]">
        <span>
          <span className="block font-medium">Pedir inicio de sesión</span>
          <span className="block text-[11px] text-muted-foreground">Con email y contraseña, contra tu API.</span>
        </span>
        <input
          type="checkbox"
          className="size-4 accent-[var(--color-primary)]"
          checked={auth.enabled}
          onChange={(e) => set({ enabled: e.target.checked, source: auth.source || project.dataSources[0]?.id || '' })}
        />
      </label>
      {auth.enabled && (
        <>
          <Field label="Se valida en">
            <Select value={auth.source} onChange={(e) => set({ source: e.target.value })} options={[{ value: '', label: 'Elegí una fuente de datos' }, ...project.dataSources.map((d) => ({ value: d.id, label: d.name }))]} />
          </Field>
          {source?.type === 'static' &&
            (users?.length ? (
              <p className="rounded-lg bg-muted p-2.5 text-[11px] text-muted-foreground">
                Usuarios de prueba (tabla <b>users</b>): {users.map((u) => `${String(u.email)} (${String(u[auth.roleField] ?? 'sin rol')})`).join(', ')}. Contraseña: la de cada uno en la tabla.
              </p>
            ) : (
              <button
                className="rounded-lg border border-dashed border-primary/50 p-2.5 text-left text-[12px] text-primary hover:bg-primary/5"
                onClick={() =>
                  update((d) => {
                    const ds = d.dataSources.find((x) => x.id === auth.source)
                    if (ds?.type === 'static') ds.tables.users = structuredClone(demoUsers)
                    d.auth.roles = [...new Set([...d.auth.roles, 'admin', 'empleado'])]
                  })
                }
              >
                + Crear usuarios de prueba (admin@demo.com y empleado@demo.com, contraseña demo123)
              </button>
            ))}
          {source?.type === 'rest' && (
            <p className="rounded-lg bg-muted p-2.5 text-[11px] text-muted-foreground">
              Se manda un POST a <b>{auth.loginPath}</b> con {auth.emailField} y {auth.passwordField}. La respuesta debe traer el token en <b>{auth.tokenPath}</b> y el usuario en <b>{auth.userPath}</b>. El token viaja en cada llamada como “Authorization: Bearer …”.
            </p>
          )}
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Roles</span>
            <div className="flex flex-wrap gap-1.5">
              {auth.roles.map((r) => (
                <span key={r} className="flex items-center gap-1 rounded-full border border-border bg-card py-0.5 pr-1 pl-2.5 text-xs">
                  {r}
                  <button className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-rose-600" onClick={() => set({ roles: auth.roles.filter((x) => x !== r) })} aria-label={`Quitar ${r}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                const r = newRole.trim()
                if (r && !auth.roles.includes(r)) set({ roles: [...auth.roles, r] })
                setNewRole('')
              }}
            >
              <TextInput value={newRole} placeholder="Nuevo rol, ej: vendedor" onChange={(e) => setNewRole(e.target.value)} />
              <button className="rounded-md border border-border px-2.5 text-[13px] hover:bg-muted" type="submit">
                Agregar
              </button>
            </form>
          </div>
          <details className="text-[13px]">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avanzado: cómo responde tu API</summary>
            <div className="mt-3 grid gap-3">
              <Field label="Ruta de ingreso"><TextInput value={auth.loginPath} onChange={(e) => set({ loginPath: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Campo del email"><TextInput value={auth.emailField} onChange={(e) => set({ emailField: e.target.value })} /></Field>
                <Field label="Campo de la contraseña"><TextInput value={auth.passwordField} onChange={(e) => set({ passwordField: e.target.value })} /></Field>
                <Field label="Dónde viene el token"><TextInput value={auth.tokenPath} onChange={(e) => set({ tokenPath: e.target.value })} /></Field>
                <Field label="Dónde viene el usuario"><TextInput value={auth.userPath} onChange={(e) => set({ userPath: e.target.value })} /></Field>
              </div>
              <Field label="Campo del rol en el usuario"><TextInput value={auth.roleField} onChange={(e) => set({ roleField: e.target.value })} /></Field>
            </div>
          </details>
        </>
      )}
    </Section>
  )
}
