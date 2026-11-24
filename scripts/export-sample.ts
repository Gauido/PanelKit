// Writes the CRM and bookings templates as exported repos to .out/<name>, the same way the editor's "Exportar repo" does.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { crmTemplate, turnosTemplate } from '../packages/schema/src'
import { generate, kebab } from '../packages/exporter/src'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export function readRuntime(): Record<string, string> {
  const base = join(root, 'packages/blocks/src')
  const out: Record<string, string> = {}
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) walk(full)
      else if (/\.(ts|tsx|css)$/.test(name)) out[relative(base, full)] = readFileSync(full, 'utf8')
    }
  }
  walk(base)
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const runtime = readRuntime()
  for (const project of [crmTemplate, turnosTemplate]) {
    const files = generate(project, runtime)
    const target = join(root, '.out', kebab(project.name))
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(target, path)), { recursive: true })
      writeFileSync(join(target, path), content)
    }
    console.log(`Wrote ${Object.keys(files).length} files to ${relative(process.cwd(), target)}`)
  }
}
