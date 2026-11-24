import { describe, expect, it } from 'vitest'
import { crmTemplate, envVars, inferFields, Project, templates, turnosTemplate } from '../packages/schema/src'
import { generate } from '../packages/exporter/src'
import { readRuntime } from '../scripts/export-sample'

describe('schema', () => {
  it('parses every template', () => {
    for (const t of templates) expect(() => Project.parse(t.project)).not.toThrow()
  })

  it('infers nested fields from an API response', () => {
    expect(inferFields([{ id: 1, name: 'Ana', company: { name: 'ACME' } }])).toEqual(['id', 'name', 'company.name'])
  })

  it('collects env vars from data sources', () => {
    const p = Project.parse({ ...crmTemplate, dataSources: [{ id: 'a', type: 'rest', name: 'A', baseUrl: '{{env.API_URL}}', headers: { Authorization: 'Bearer {{env.API_TOKEN}}' } }] })
    expect(envVars(p)).toEqual(['API_TOKEN', 'API_URL'])
  })
})

describe('exporter', () => {
  const files = generate(crmTemplate, readRuntime())

  it('writes one page file per page and the runtime blocks', () => {
    expect(Object.keys(files)).toEqual(
      expect.arrayContaining(['src/pages/dashboard.tsx', 'src/pages/contactos.tsx', 'src/pages/tareas.tsx', 'src/components/blocks/data-table.tsx', 'src/main.tsx', 'package.json', 'panelkit.json']),
    )
  })

  it('turns events into readable code', () => {
    const page = files['src/pages/contactos.tsx']!
    expect(page).toContain("await datosDeEjemplo.request('POST', '/contacts', values)")
    expect(page).toContain("toast(tpl('Contacto {{values.name}} creado', { values }), 'success')")
    expect(page).toContain('await queryClient.invalidateQueries()')
  })

  it('exports sample data as an in-memory API', () => {
    expect(files['src/api/client.ts']).toContain('createMockApi(sampleData.datosDeEjemplo')
    expect(files['src/api/sample-data.ts']).toContain('Ana Gómez')
  })

  it('wires theme, fonts, dependencies and custom CSS', () => {
    const p = Project.parse({
      ...turnosTemplate,
      dependencies: [
        { name: 'bootstrap', version: '^5.3.9', kind: 'css', css: 'dist/css/bootstrap.min.css' },
        { name: 'daisyui', version: '^5.8.2', kind: 'tailwind-plugin' },
      ],
      customCss: '.pk-html h2 { letter-spacing: -0.02em; }',
    })
    const out = generate(p, readRuntime())
    const css = out['src/index.css']!
    expect(css.indexOf("@import 'bootstrap/dist/css/bootstrap.min.css';")).toBeLessThan(css.indexOf("@import 'tailwindcss';"))
    expect(css).toContain("@plugin 'daisyui';")
    expect(css).toContain("@import '@fontsource-variable/plus-jakarta-sans';")
    expect(css).toContain('--primary: #416900;')
    expect(out['src/custom.css']).toContain('letter-spacing')
    const pkg = JSON.parse(out['package.json']!)
    expect(pkg.dependencies.bootstrap).toBe('^5.3.9')
    expect(pkg.dependencies['@fontsource-variable/inter']).toBeUndefined()
    expect(out['index.html']).toContain('data-motion="subtle"')
  })

  it('keeps secrets out of the code', () => {
    const p = Project.parse({ ...crmTemplate, dataSources: [{ id: 'demo', type: 'rest', name: 'Demo API', baseUrl: '{{env.API_URL}}', headers: { Authorization: 'Bearer {{env.API_TOKEN}}' } }] })
    expect(generate(p, readRuntime())['src/api/client.ts']).not.toContain('sampleData')
    const out = generate(p, readRuntime())
    expect(out['src/api/client.ts']).toContain('import.meta.env.VITE_API_URL')
    expect(out['.env.example']).toBe('VITE_API_TOKEN=\nVITE_API_URL=\n')
  })
})
