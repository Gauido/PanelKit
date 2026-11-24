import { useQueries, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  ActionButton, AvailabilityGrid, Calendar, Chart, DataTable, EntityForm, Filter, HtmlBlock, KpiCard, Modal, PageHeader, Section, Tabs, Timeline,
  resolve, tpl, useApiQuery, type Slot,
} from '@panelkit/blocks'
import { layoutClass, registry, styleClass } from '@panelkit/exporter'
import { openKey, type Node } from '@panelkit/schema'
import { useEditor } from '../store'
import { apiFor, runActions } from './actions'
import { usePage } from './page-state'

function useNodeData(queryId: unknown, state: Record<string, unknown>) {
  const project = useEditor((s) => s.project)
  const env = useEditor((s) => s.env)
  const q = typeof queryId === 'string' ? project.queries.find((x) => x.id === queryId) : undefined
  const api = q ? apiFor(project, q.source, env) : undefined
  return useApiQuery(api, q ? tpl(q.path, { state }) : undefined)
}

/** Rows of every query a form uses for its select options, keyed by query id. */
function useOptionData(fields: unknown, state: Record<string, unknown>) {
  const project = useEditor((s) => s.project)
  const env = useEditor((s) => s.env)
  const ids = [...new Set((Array.isArray(fields) ? fields : []).map((f) => f?.optionsQuery).filter((x): x is string => typeof x === 'string' && Boolean(x)))]
  const results = useQueries({
    queries: ids.map((id) => {
      const q = project.queries.find((x) => x.id === id)
      const api = q ? apiFor(project, q.source, env) : undefined
      const path = q ? tpl(q.path, { state }) : ''
      return { queryKey: [api?.baseUrl, path], queryFn: () => api!.request('GET', path), enabled: Boolean(api && q) }
    }),
  })
  return Object.fromEntries(ids.map((id, i) => [id, results[i]?.data]))
}

/** How a container shows its children: the canvas passes an editable area, the preview plain blocks. */
export type RenderChildren = (parent: Node, layout: 'grid' | 'list') => ReactNode

type Props = {
  node: Node
  live: boolean
  onNavigate: (to: string) => void
  /** Design mode: overlays (modal, drawer) are drawn inline so you can edit them. */
  design?: boolean
  renderChildren?: RenderChildren
}

/** Renders a node with live data. `onNavigate` decides what a navigate action does. */
export function BlockView({ node, live, onNavigate, design, renderChildren }: Props) {
  const project = useEditor((s) => s.project)
  const env = useEditor((s) => s.env)
  const queryClient = useQueryClient()
  const page = usePage()
  const data = useNodeData(node.props.query ?? node.props.optionsQuery, page.state)
  const optionData = useOptionData(node.type === 'EntityForm' ? node.props.fields : undefined, page.state)
  const raw = node.props as Record<string, any>
  // {{state.x}} anywhere in the props is filled from the page variables (the HTML block escapes its own).
  const p = (node.type === 'HtmlBlock' ? raw : resolve(raw, { state: page.state })) as Record<string, any>
  const ctx = { project, env, navigate: onNavigate, queryClient, page }
  const handler = (event: string) =>
    live && node.events[event]?.length ? (arg?: Record<string, unknown>, key?: string) => runActions(node.events[event], key ? { [key]: arg } : {}, ctx) : undefined
  /** Fire-and-forget handler for events that pass one argument named `key`. */
  const on = (event: string, key: string) => {
    const h = handler(event)
    return h ? (arg: Record<string, unknown>) => void h(arg, key).catch(() => {}) : undefined
  }
  const kids = (layout: 'grid' | 'list') =>
    renderChildren
      ? renderChildren(node, layout)
      : (node.children ?? []).map((c) =>
          registry[c.type]?.container === 'overlay' ? (
            <BlockView key={c.id} node={c} live={live} onNavigate={onNavigate} design={design} />
          ) : (
          <div key={c.id} className={layout === 'grid' ? `${layoutClass(c.layout)} ${styleClass(c.style)}` : styleClass(c.style)}>
            <BlockView node={c} live={live} onNavigate={onNavigate} design={design} />
          </div>
          ),
        )

  switch (node.type) {
    case 'PageHeader':
      return <PageHeader title={p.title ?? ''} subtitle={p.subtitle} />
    case 'KpiCard':
      return <KpiCard {...p} title={p.title ?? ''} data={data.data} loading={data.isLoading} />
    case 'DataTable': {
      const h = handler('onRowClick')
      return (
        <DataTable
          title={p.title}
          columns={p.columns ?? []}
          pageSize={p.pageSize}
          searchable={p.searchable}
          data={data.data}
          loading={data.isLoading}
          error={data.error?.message}
          filterField={p.filterField || undefined}
          onRowClick={h ? (row) => void h(row, 'row').catch(() => {}) : undefined}
          onRowEdit={on('onRowEdit', 'row')}
          onRowDelete={on('onRowDelete', 'row')}
        />
      )
    }
    case 'EntityForm': {
      const h = handler('onSubmit')
      return (
        <EntityForm
          title={p.title}
          description={p.description}
          fields={p.fields ?? []}
          submitLabel={p.submitLabel}
          optionData={optionData}
          initialValues={p.initialValues && typeof p.initialValues === 'object' ? p.initialValues : undefined}
          resetOnSubmit={p.resetOnSubmit}
          onSubmit={h ? (values) => h(values, 'values') : undefined}
        />
      )
    }
    case 'ActionButton': {
      const h = handler('onClick')
      return <ActionButton label={p.label ?? 'Botón'} variant={p.variant} fullWidth={p.fullWidth} onClick={h ? () => h().catch(() => {}) : undefined} />
    }
    case 'Chart':
      return <Chart {...p} data={data.data} loading={data.isLoading} />
    case 'Timeline':
      return <Timeline {...p} data={data.data} loading={data.isLoading} onItemClick={on('onItemClick', 'row')} />
    case 'Calendar':
      return <Calendar {...p} data={data.data} loading={data.isLoading} onEventClick={on('onEventClick', 'row')} onDayClick={on('onDayClick', 'day') as ((d: { date: string }) => void) | undefined} />
    case 'AvailabilityGrid':
      return <AvailabilityGrid {...p} data={data.data} loading={data.isLoading} onSlotClick={on('onSlotClick', 'slot') as ((s: Slot) => void) | undefined} onBookingClick={on('onBookingClick', 'row')} />
    case 'Filter': {
      const key = String(p.stateKey || 'filtro')
      const h = handler('onChange')
      return (
        <Filter
          {...p}
          data={data.data}
          value={page.state[key]}
          onChange={(value) => {
            page.set(key, value)
            void h?.(value as never, 'value')?.catch(() => {})
          }}
        />
      )
    }
    case 'HtmlBlock':
      return <HtmlBlock html={p.html ?? ''} scope={{ state: page.state }} />
    case 'Section':
      return <Section title={p.title} description={p.description} card={p.card}>{kids('grid')}</Section>
    case 'Tabs': {
      const labels = (node.children ?? []).map((c, i) => String(c.props.title ?? '') || registry[c.type]?.label || `Pestaña ${i + 1}`)
      if (design) {
        return (
          <div className="rounded-[var(--radius)] border border-dashed border-primary/40 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Pestañas: {labels.join(' · ') || 'arrastrá bloques acá, cada uno es una pestaña'}</p>
            {kids('list')}
          </div>
        )
      }
      return <Tabs labels={labels} variant={p.variant}>{kids('list')}</Tabs>
    }
    case 'Modal': {
      const key = openKey(node.id)
      if (design) {
        return (
          <div className="rounded-[var(--radius)] border border-dashed border-primary/50 bg-muted/30 p-4">
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{p.kind === 'drawer' ? 'Panel lateral' : 'Modal'}</span>
              <span className="font-semibold">{p.title}</span>
              <span className="text-xs text-muted-foreground">Se abre con la acción “Abrir modal”. Arrastrá bloques adentro.</span>
            </div>
            {kids('grid')}
          </div>
        )
      }
      return (
        <Modal title={p.title} description={p.description} kind={p.kind} size={p.size} open={Boolean(page.state[key])} onClose={() => page.set(key, false)}>
          {kids('grid')}
        </Modal>
      )
    }
    default:
      return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Bloque desconocido: {node.type}</div>
  }
}
