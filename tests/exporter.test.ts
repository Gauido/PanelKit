import { describe, expect, it } from 'vitest'
import { crmTemplate, envVars, inferFields, Project } from '../packages/schema/src'
import { generate } from '../packages/exporter/src'
import { readRuntime } from '../scripts/export-sample'

describe('schema', () => {
  it('parses the CRM template', () => {
    expect(() => Project.parse(crmTemplate)).not.toThrow()
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
    expect(page).toContain("await demoApi.request('POST', '/users', values)")
    expect(page).toContain("toast(tpl('Contacto {{values.name}} creado', { values }), 'success')")
    expect(page).toContain('await queryClient.invalidateQueries()')
  })

  it('keeps secrets out of the code', () => {
    const p = Project.parse({ ...crmTemplate, dataSources: [{ id: 'demo', type: 'rest', name: 'Demo API', baseUrl: '{{env.API_URL}}', headers: { Authorization: 'Bearer {{env.API_TOKEN}}' } }] })
    const out = generate(p, readRuntime())
    expect(out['src/api/client.ts']).toContain('import.meta.env.VITE_API_URL')
    expect(out['.env.example']).toBe('VITE_API_TOKEN=\nVITE_API_URL=\n')
  })
})
