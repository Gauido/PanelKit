import { useQueryClient } from '@tanstack/react-query'
import { ActionButton, DataTable, EntityForm, HtmlBlock, KpiCard, PageHeader, useApiQuery } from '@panelkit/blocks'
import type { Node } from '@panelkit/schema'
import { useEditor } from '../store'
import { apiFor, runActions } from './actions'

function useNodeData(queryId: unknown) {
  const project = useEditor((s) => s.project)
  const env = useEditor((s) => s.env)
  const q = typeof queryId === 'string' ? project.queries.find((x) => x.id === queryId) : undefined
  const api = q ? apiFor(project, q.source, env) : undefined
  return useApiQuery(api, q?.path)
}

/** Renders a node with live data. `onNavigate` decides what a navigate action does. */
export function BlockView({ node, live, onNavigate }: { node: Node; live: boolean; onNavigate: (to: string) => void }) {
  const project = useEditor((s) => s.project)
  const env = useEditor((s) => s.env)
  const queryClient = useQueryClient()
  const data = useNodeData(node.props.query)
  const p = node.props as Record<string, any>
  const ctx = { project, env, navigate: onNavigate, queryClient }
  const handler = (event: string) =>
    live && node.events[event]?.length ? (arg?: Record<string, unknown>, key?: string) => runActions(node.events[event], key ? { [key]: arg } : {}, ctx) : undefined

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
          onRowClick={h ? (row) => void h(row, 'row').catch(() => {}) : undefined}
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
          onSubmit={h ? (values) => h(values, 'values') : undefined}
        />
      )
    }
    case 'ActionButton': {
      const h = handler('onClick')
      return <ActionButton label={p.label ?? 'Botón'} variant={p.variant} fullWidth={p.fullWidth} onClick={h ? () => h().catch(() => {}) : undefined} />
    }
    case 'HtmlBlock':
      return <HtmlBlock html={p.html ?? ''} />
    default:
      return <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Bloque desconocido: {node.type}</div>
  }
}
