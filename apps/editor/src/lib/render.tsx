import { useQueries, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  ActionButton, AvailabilityGrid, Calendar, Chart, DataTable, Divider, EntityForm, Filter, HtmlBlock, Image, KpiCard, Modal, PageHeader, Section, Spacer, Stack, Tabs, Text, Timeline,
  hasRole, hasTemplate, resolve, toRows, tpl, useSession, useApiQuery, whenText, type Slot,
} from '@panelkit/blocks'
import { layoutClass, registry, styleClass, styleCss } from '@panelkit/exporter'
import { openKey, type Node } from '@panelkit/schema'
import { useEditor } from '../store'
import { apiFor, runActions } from './actions'
import { usePage } from './page-state'
import { InlineText } from './inline-text'
import { ItemContext, useItem } from './item-scope'

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
export type RenderChildren = (parent: Node, layout: 'grid' | 'list' | 'flex') => ReactNode

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
  const itemScope = useItem()
  const session = useSession()
  const scope = { state: page.state, user: session?.user ?? {}, ...(itemScope ?? {}) }
  const data = useNodeData(node.props.query ?? node.props.optionsQuery, page.state)
  const optionData = useOptionData(node.type === 'EntityForm' ? node.props.fields : undefined, page.state)
  const raw = node.props as Record<string, any>
  // {{state.x}} anywhere in the props is filled from the page variables (the HTML block escapes its own).
  const p = (node.type === 'HtmlBlock' ? raw : resolve(raw, scope)) as Record<string, any>
  const ctx = { project, env, navigate: onNavigate, queryClient, page }
  const handler = (event: string) =>
    live && node.events[event]?.length ? (arg?: Record<string, unknown>, key?: string) => runActions(node.events[event], { ...(itemScope ?? {}), ...(key ? { [key]: arg } : {}) }, ctx) : undefined
  /** Fire-and-forget handler for events that pass one argument named `key`. */
  const on = (event: string, key: string) => {
    const h = handler(event)
    return h ? (arg: Record<string, unknown>) => void h(arg, key).catch(() => {}) : undefined
  }
  const kids = (layout: 'grid' | 'list' | 'flex') =>
    renderChildren ? renderChildren(node, layout) : <Children parent={node} layout={layout} live={live} onNavigate={onNavigate} design={design} />
  switch (node.type) {
    case 'PageHeader':
      // Selected on the canvas: type straight into the title and subtitle.
      if (design && live)
        return (
          <div className="py-1">
            <InlineText nodeId={node.id} prop="title" value={String(raw.title ?? '')} as="h1" className="block text-2xl font-semibold tracking-tight" placeholder="Título" />
            <InlineText nodeId={node.id} prop="subtitle" value={String(raw.subtitle ?? '')} as="p" className="mt-1 block text-sm text-muted-foreground" placeholder="Subtítulo (opcional)" />
          </div>
        )
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
      return <HtmlBlock html={p.html ?? ''} scope={scope} />
    case 'Repeater': {
      const rows = toRows(data.data)
      if (design) {
        // Designing: the blocks inside are drawn once, filled with the first row.
        return (
          <div className="rounded-[var(--radius)] border border-dashed border-primary/40 p-3">
            <p className="mb-1 text-xs text-muted-foreground">
              <span className="font-medium text-primary">Se repite {rows.length ? `${rows.length} veces` : 'por cada registro'}</span>
              {' · '}Lo de adentro se dibuja una vez por registro. En sus textos tocá «+ Dato» para mostrar los campos de cada uno.
            </p>
            <ItemContext.Provider value={rows[0] ? { item: rows[0], index: 0 } : null}>{kids('grid')}</ItemContext.Provider>
          </div>
        )
      }
      if (data.isLoading && !rows.length) return <div className="h-24 animate-pulse rounded-[var(--radius)] bg-muted" />
      if (!rows.length) return <p className="rounded-[var(--radius)] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{p.emptyText}</p>
      return (
        <div className="@container grid grid-cols-12 gap-4">
          {rows.map((item, index) => (
            <ItemContext.Provider key={String(item.id ?? index)} value={{ item, index }}>
              {kids('grid')}
            </ItemContext.Provider>
          ))}
        </div>
      )
    }
    case 'Text':
      // Texts that show data ({{item.x}}) are edited in the panel, so the canvas keeps showing real values.
      if (design && live && !raw.href && !hasTemplate(raw.text)) {
        const cls = { title: 'text-2xl font-semibold tracking-tight', subtitle: 'text-lg font-medium', paragraph: 'text-sm leading-relaxed', small: 'text-xs text-muted-foreground', label: 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground' }[String(raw.variant ?? 'paragraph')]
        return <InlineText nodeId={node.id} prop="text" value={String(raw.text ?? '')} multiline as="p" className={`block whitespace-pre-line ${cls ?? ''}`} placeholder="Escribí tu texto" />
      }
      return <Text text={p.text == null ? '' : String(p.text)} variant={p.variant} href={p.href || undefined} newTab={p.newTab} />
    case 'Image':
      return <Image src={p.src || undefined} alt={p.alt} fit={p.fit} height={Number(p.height) || undefined} rounded={p.rounded} caption={p.caption} />
    case 'Divider':
      return <Divider label={p.label} spacing={p.spacing} />
    case 'Spacer':
      return design ? (
        <div className="grid place-items-center rounded-md border border-dashed border-border text-[11px] text-muted-foreground" style={{ height: Number(p.size) || 24 }}>
          Espacio {Number(p.size) || 24}px
        </div>
      ) : (
        <Spacer size={Number(p.size) || 24} />
      )
    case 'Stack':
      return (
        <Stack direction={p.direction} gap={p.gap} align={p.align} justify={p.justify} wrap={p.wrap} stackOnMobile={p.stackOnMobile}>
          {kids('flex')}
        </Stack>
      )
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

/** A container's blocks outside the canvas (Probar): each in its box, hidden when its condition fails. */
function Children({ parent, layout, live, onNavigate, design }: { parent: Node; layout: 'grid' | 'list' | 'flex'; live: boolean; onNavigate: (to: string) => void; design?: boolean }) {
  const page = usePage()
  const itemScope = useItem()
  const session = useSession()
  const auth = useEditor((s) => s.project.auth)
  return (
    <>
      {(parent.children ?? []).map((c) => {
        if (registry[c.type]?.container === 'overlay') return <BlockView key={c.id} node={c} live={live} onNavigate={onNavigate} design={design} />
        // Tabs keep every tab; elsewhere a block whose condition fails is left out.
        const visible = whenText(c.visibleIf, { state: page.state, user: session?.user ?? {}, ...(itemScope ?? {}) }) && (design || !auth.enabled || hasRole(session, c.roles, auth.roleField))
        if (!visible && layout !== 'list') return null
        return (
          <div key={c.id} className={layout === 'grid' ? `${layoutClass(c.layout)} ${styleClass(c.style)}` : styleClass(c.style)} style={styleCss(c.style)}>
            {visible && <BlockView node={c} live={live} onNavigate={onNavigate} design={design} />}
          </div>
        )
      })}
    </>
  )
}
