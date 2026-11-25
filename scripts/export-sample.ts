// Writes the CRM and bookings templates as exported repos to .out/<name>, the same way the editor's "Exportar repo" does.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crmTemplate, turnosTemplate, type Project } from '../packages/schema/src'
import { generate, kebab } from '../packages/exporter/src'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function readRuntime(): Record<string, string> {
  const base = join(root, 'packages/blocks/src')
  const out: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      // Keys use forward slashes on every OS (Windows paths would break the export).
      else if (/\.(ts|tsx|css)$/.test(name)) out[relative(base, full).split(sep).join('/')] = readFileSync(full, 'utf8')
    }
  }
  walk(base)
  return out
}

/** The CRM with sign in: admins see everything, employees don't see Tareas or the admin-only notice. */
export function crmWithLogin(): Project {
  const p = structuredClone(crmTemplate)
  p.name = 'CRM con login'
  p.auth = { ...p.auth, enabled: true, source: 'demo', roles: ['admin', 'empleado'] }
  const demo = p.dataSources.find((d) => d.id === 'demo')
  if (demo?.type === 'static') {
    demo.tables.users = [
      { id: 1, name: 'Ana Admin', email: 'admin@demo.com', password: 'demo123', role: 'admin' },
      { id: 2, name: 'Bruno Empleado', email: 'empleado@demo.com', password: 'demo123', role: 'empleado' },
    ]
  }
  p.pages.find((x) => x.id === 'tareas')!.roles = ['admin']
  p.pages[0]!.children.splice(1, 0,
    { id: 'hola', type: 'Text', layout: { span: 12 }, props: { text: 'Hola, {{user.name}}', variant: 'subtitle' }, style: {}, events: {} },
    { id: 'solo_admin', type: 'Text', layout: { span: 12 }, props: { text: 'Solo los admins ven este aviso.', variant: 'small' }, style: {}, events: {}, roles: ['admin'] },
  )
  return p
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const runtime = readRuntime()
  for (const project of [crmTemplate, turnosTemplate, crmWithLogin()]) {
    const files = generate(project, runtime)
    const target = join(root, '.out', kebab(project.name))
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(target, path)), { recursive: true })
      writeFileSync(join(target, path), content)
    }
    console.log(`Wrote ${Object.keys(files).length} files to ${relative(process.cwd(), target)}`)
  }
}
