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
    expect(page).toContain("toast(tpl('Contacto {{values.name}} creado', { values, state: page.get() }), 'success')")
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

describe('agenda and charts', () => {
  const files = generate(turnosTemplate, readRuntime())
  const agenda = files['src/pages/agenda.tsx']!

  it('opens a prefilled form when a free slot is clicked', () => {
    expect(agenda).toContain("onSlotClick={async (slot) => {")
    expect(agenda).toContain("page.set('nuevo', bind('{{slot}}', { slot, state: page.get() }))")
    expect(agenda).toContain("page.set('open_m_nuevo', true)")
    expect(agenda).toContain("initialValues={bind('{{state.nuevo}}', { state })}")
    expect(agenda).toContain("import { confirm } from '@/components/ui/confirm'")
  })

  it('lets filters drive other blocks and selects load options from the API', () => {
    expect(agenda).toContain("const bookingsFiltered = useApiQuery(datosDelClub, tpl('/bookings?court={{state.cancha}}&date={{state.dia}}', { state }))")
    expect(agenda).toContain("value={state['cancha']}")
    expect(agenda).toContain("page.set('cancha', value)")
    expect(agenda).toContain("optionData={{ courts: courts.data }}")
  })

  it('deletes a row through a templated path', () => {
    expect(agenda).toContain("onRowDelete={async (row) => {")
    expect(agenda).toContain("await datosDelClub.request('DELETE', tpl('/bookings/{{row.id}}', { row, state: page.get() }))")
  })

  it('mounts the confirm dialog and ships the new blocks', () => {
    expect(files['src/main.tsx']).toContain('<ConfirmHost />')
    for (const f of ['chart', 'calendar', 'availability-grid', 'timeline']) expect(files[`src/components/blocks/${f}.tsx`]).toBeTruthy()
  })
})

describe('chart grouping', async () => {
  const { groupRows } = await import('../packages/blocks/src/components/blocks/chart')
  const rows = [
    { court: 'A', amount: 10, date: '2026-01-05' },
    { court: 'B', amount: 5, date: '2026-01-20' },
    { court: 'A', amount: 20, date: '2026-02-01' },
  ]
  it('sums by label', () => {
    expect(groupRows({ data: rows, labelField: 'court', valueField: 'amount', aggregate: 'sum' })).toEqual([
      { label: 'A', value: 30 },
      { label: 'B', value: 5 },
    ])
  })
  it('counts by month', () => {
    expect(groupRows({ data: rows, labelField: 'date', aggregate: 'count', dateGroup: 'month' })).toEqual([
      { label: '2026-01', value: 2 },
      { label: '2026-02', value: 1 },
    ])
  })
})

describe('page state, containers and custom code', () => {
  const crm = generate(crmTemplate, readRuntime())['src/pages/contactos.tsx']!
  const agenda = generate(turnosTemplate, readRuntime())['src/pages/agenda.tsx']!
  const canchas = generate(turnosTemplate, readRuntime())['src/pages/canchas.tsx']!

  it('keeps page variables and binds props to them', () => {
    expect(crm).toContain('const page = usePageState({})')
    expect(crm).toContain("page.set('seleccionado', bind('{{row}}', { row, state: page.get() }))")
    expect(crm).toContain("initialValues={bind('{{state.seleccionado}}', { state })}")
    expect(crm).toContain("await datosDeEjemplo.request('PUT', tpl('/contacts/{{state.seleccionado.id}}'")
  })

  it('renders modals outside the grid and opens them through state', () => {
    expect(crm).toContain("open={Boolean(state['open_m_contacto'])}")
    expect(crm).toContain("page.set('open_m_contacto', true)")
    expect(crm).not.toMatch(/<Reveal[^>]*>\s*<Modal/)
  })

  it('escapes data in the HTML block through its scope', () => {
    expect(crm).toContain('scope={{ state }}')
  })

  it('prints custom code inline with its helpers', () => {
    expect(agenda).toContain('await (async ({ state, setState, apis, navigate, toast, refresh }: CodeScope) => {')
    expect(agenda).toContain("  await apis.datosDelClub.request('PATCH', '/bookings/' + state.turno.id, { status: 'Pagada' })")
  })

  it('nests blocks in tabs and sections', () => {
    expect(canchas).toContain("<Tabs variant=\"underline\" labels={['Listado', 'Nueva cancha']}>")
    expect(canchas).toMatch(/<Section title="Listado" card=\{false\}>\s*<div className="col-span-12">\s*<DataTable/)
  })
})

describe('free layout, conditions and repeaters', () => {
  const dir = generate(crmTemplate, readRuntime())['src/pages/directorio.tsx']!

  it('repeats the blocks inside once per row, with item in scope', () => {
    expect(dir).toMatch(/<Repeater\s+emptyText="Todavía no hay contactos."\s+data=\{contacts.data\}\s+loading=\{contacts.isLoading\}\s+>/)
    expect(dir).toContain('{(item, index) => (')
    expect(dir).toContain("title={bind('{{item.name}}', { state, item, index })}")
    expect(dir).toContain("description={tpl('{{item.company}} · {{item.city}}', { state, item, index })}")
  })

  it('guards conditional blocks and keeps free CSS', () => {
    expect(dir).toContain("{when(() => item.stage === 'Cliente') && (")
    expect(dir).toContain("style={{ paddingBottom: '4px' }}")
    expect(dir).toContain('<div className="col-span-12 text-emerald-600">')
  })

  it('lays flex children out by their content, not on the grid', () => {
    expect(dir).toMatch(/<Stack[^>]*>\s*<div>\s*<Text text="Directorio" variant="title" \/>/)
  })

  it('ignores a broken condition instead of breaking the build', async () => {
    const { conditionOf } = await import('../packages/exporter/src/generate')
    expect(conditionOf({ id: 'x', type: 'Text', layout: { span: 12 }, props: {}, style: {}, events: {}, visibleIf: 'state.(' })).toBeUndefined()
  })
})

describe('templates at runtime', async () => {
  const { resolve, tpl } = await import('../packages/blocks/src/lib/template')
  it('returns whole values for a single placeholder', () => {
    const row = { id: 3, name: 'Ana' }
    expect(resolve('{{row}}', { row })).toBe(row)
    expect(resolve('Hola {{row.name}}', { row })).toBe('Hola Ana')
    expect(resolve({ a: '{{row.id}}', b: ['{{row.name}}'] }, { row })).toEqual({ a: 3, b: ['Ana'] })
    expect(tpl('{{x.y}}', {})).toBe('')
  })
})

describe('responsive layout', async () => {
  const { layoutClass } = await import('../packages/exporter/src/layout')
  it('uses container queries with per-device widths and visibility', () => {
    expect(layoutClass({ span: 3 })).toBe('col-span-12 @3xl:col-span-6 @5xl:col-span-3')
    expect(layoutClass({ span: 12 })).toBe('col-span-12')
    expect(layoutClass({ span: 4, spanTablet: 4, spanMobile: 6 })).toBe('col-span-6 @3xl:col-span-4')
    expect(layoutClass({ span: 6, hide: ['mobile'] })).toBe('col-span-12 @5xl:col-span-6 hidden @3xl:block')
    expect(layoutClass({ span: 6, hide: ['desktop'] })).toBe('col-span-12 @5xl:col-span-6 @5xl:hidden')
  })
})
